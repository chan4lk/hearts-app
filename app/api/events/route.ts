import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
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
        select: { status: true },
      },
    },
  });

  // Map to include user's participation status
  const mapped = events.map(e => ({
    ...e,
    myStatus: e.participations[0]?.status || null,
    participations: undefined, // Remove raw participations
  }));

  return NextResponse.json(mapped);
}

const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dateTime: z.string(),
  location: z.string().max(200).optional(),
  eventType: z.string().max(50).optional(),
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
