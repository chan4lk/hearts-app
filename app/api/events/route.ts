import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { sanitizeInput, sanitizeInputPreserveNewlines } from '@/lib/securityUtils';
import { z } from 'zod';

// GET — list events
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { dateTime: 'desc' },
    include: {
      _count: { select: { participations: true } },
      participations: {
        where: { userId: ctx.userId },
        select: { status: true, mealPreference: true },
      },
    },
  });

  // Aggregate CONFIRMED meal counts per event in one query
  const mealGroups = await prisma.eventParticipation.groupBy({
    by: ['eventId', 'mealPreference'],
    where: {
      tenantId: ctx.tenantId,
      status: 'CONFIRMED',
      eventId: { in: events.map((e) => e.id) },
    },
    _count: { _all: true },
  });
  const mealByEvent = new Map<string, { veg: number; nonVeg: number; unspecified: number; confirmed: number }>();
  for (const g of mealGroups) {
    const bucket = mealByEvent.get(g.eventId) ?? { veg: 0, nonVeg: 0, unspecified: 0, confirmed: 0 };
    const count = g._count._all;
    if (g.mealPreference === 'VEG') bucket.veg = count;
    else if (g.mealPreference === 'NON_VEG') bucket.nonVeg = count;
    else bucket.unspecified = count;
    bucket.confirmed += count;
    mealByEvent.set(g.eventId, bucket);
  }

  const mapped = events.map((e) => ({
    ...e,
    myStatus: e.participations[0]?.status || null,
    myMealPreference: e.participations[0]?.mealPreference || 'NONE',
    mealCounts: mealByEvent.get(e.id) ?? { veg: 0, nonVeg: 0, unspecified: 0, confirmed: 0 },
    participations: undefined,
  }));

  return NextResponse.json(mapped);
}

const CreateEventSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeInput)
    .refine((s) => s.length > 0, 'Title cannot be empty'),
  description: z.string().max(2000).transform(sanitizeInputPreserveNewlines).optional(),
  dateTime: z.string(),
  location: z.string().max(200).transform(sanitizeInput).optional(),
  eventType: z.string().max(50).transform(sanitizeInput).optional(),
});

// POST — create event (admin only)
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      tenantId: ctx.tenantId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      dateTime: new Date(parsed.data.dateTime),
      location: parsed.data.location || null,
      eventType: parsed.data.eventType || null,
    },
  });

  // Create participation records for all active users
  const users = await prisma.user.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    select: { id: true },
  });

  if (users.length > 0) {
    await prisma.eventParticipation.createMany({
      data: users.map(u => ({ tenantId: ctx.tenantId, eventId: event.id, userId: u.id, status: 'PENDING' as const })),
    });
  }

  await logAudit(ctx, { action: AuditAction.EVENT_CREATED, entity: 'Event', entityId: event.id, details: { title: event.title } });

  return NextResponse.json(event, { status: 201 });
}
