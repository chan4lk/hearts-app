import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { sanitizeInput, sanitizeInputPreserveNewlines } from '@/lib/securityUtils';
import { z } from 'zod';

// GET — event detail with attendance
export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, tenantId: ctx.tenantId },
    include: {
      participations: {
        include: { user: { select: { id: true, name: true, email: true, department: true } } },
        orderBy: { user: { name: 'asc' } },
      },
    },
  });

  if (!event) return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });

  const confirmedParticipations = event.participations.filter((p) => p.status === 'CONFIRMED');
  const stats = {
    confirmed: confirmedParticipations.length,
    declined: event.participations.filter((p) => p.status === 'DECLINED').length,
    pending: event.participations.filter((p) => p.status === 'PENDING').length,
    meal: {
      veg: confirmedParticipations.filter((p) => p.mealPreference === 'VEG').length,
      nonVeg: confirmedParticipations.filter((p) => p.mealPreference === 'NON_VEG').length,
      unspecified: confirmedParticipations.filter((p) => p.mealPreference === 'NONE').length,
    },
  };

  return NextResponse.json({ ...event, stats });
}

const UpdateEventSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeInput)
    .refine((s) => s.length > 0, 'Title cannot be empty').optional(),
  description: z.string().max(2000).transform(sanitizeInputPreserveNewlines).nullable().optional(),
  dateTime: z.string().optional(),
  location: z.string().max(200).transform(sanitizeInput).nullable().optional(),
  eventType: z.string().max(50).transform(sanitizeInput).nullable().optional(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
});

// PATCH — edit event (admin only)
export async function PATCH(req: NextRequest, { params }: { params: { eventId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const event = await prisma.event.findFirst({ where: { id: params.eventId, tenantId: ctx.tenantId } });
  if (!event) return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });

  const updated = await prisma.event.update({
    where: { id: params.eventId },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.dateTime !== undefined && { dateTime: new Date(parsed.data.dateTime) }),
      ...(parsed.data.location !== undefined && { location: parsed.data.location }),
      ...(parsed.data.eventType !== undefined && { eventType: parsed.data.eventType }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    },
  });

  const statusChanged = parsed.data.status !== undefined && parsed.data.status !== event.status;
  if (statusChanged) {
    const action =
      parsed.data.status === 'CANCELLED'
        ? AuditAction.EVENT_CANCELLED
        : parsed.data.status === 'SCHEDULED'
        ? AuditAction.EVENT_REACTIVATED
        : AuditAction.EVENT_UPDATED;
    await logAudit(ctx, {
      action,
      entity: 'Event',
      entityId: params.eventId,
      details: { from: event.status, to: parsed.data.status, title: event.title },
    });
  } else {
    await logAudit(ctx, {
      action: AuditAction.EVENT_UPDATED,
      entity: 'Event',
      entityId: params.eventId,
      details: { title: updated.title },
    });
  }

  return NextResponse.json(updated);
}

// DELETE — permanently delete event + all participations (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { eventId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const event = await prisma.event.findFirst({ where: { id: params.eventId, tenantId: ctx.tenantId } });
  if (!event) return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });

  // Hard delete — EventParticipation rows cascade via the
  // 20260420185636_add_cascade_rules migration.
  await prisma.event.delete({ where: { id: params.eventId } });

  await logAudit(ctx, {
    action: AuditAction.EVENT_DELETED,
    entity: 'Event',
    entityId: params.eventId,
    details: { title: event.title, status: event.status },
  });

  return NextResponse.json({ success: true });
}
