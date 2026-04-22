import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { z } from 'zod';

const ParticipateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DECLINED']).optional(),
  mealPreference: z.enum(['NONE', 'VEG', 'NON_VEG']).optional(),
});

// POST — employee updates their own participation (status and/or meal preference)
export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const parsed = ParticipateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  if (parsed.data.status === undefined && parsed.data.mealPreference === undefined) {
    return NextResponse.json(
      { error: 'Provide status or mealPreference', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Make sure the event exists and is in this tenant; block RSVPs to cancelled events
  const event = await prisma.event.findFirst({
    where: { id: (await params).eventId, tenantId: ctx.tenantId },
    select: { status: true },
  });
  if (!event) return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });
  if (event.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'Event has been cancelled; RSVPs are closed', code: 'CONFLICT' },
      { status: 409 }
    );
  }

  const participation = await prisma.eventParticipation.upsert({
    where: {
      tenantId_eventId_userId: {
        tenantId: ctx.tenantId,
        eventId: (await params).eventId,
        userId: ctx.userId,
      },
    },
    update: {
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
      ...(parsed.data.mealPreference !== undefined && { mealPreference: parsed.data.mealPreference }),
    },
    create: {
      tenantId: ctx.tenantId,
      eventId: (await params).eventId,
      userId: ctx.userId,
      status: parsed.data.status ?? 'PENDING',
      mealPreference: parsed.data.mealPreference ?? 'NONE',
    },
  });

  await logAudit(ctx, {
    action: AuditAction.EVENT_PARTICIPATION_CHANGED,
    entity: 'EventParticipation',
    entityId: participation.id,
    details: {
      eventId: (await params).eventId,
      status: participation.status,
      mealPreference: participation.mealPreference,
    },
  });

  return NextResponse.json(participation);
}
