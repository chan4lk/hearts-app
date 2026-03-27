import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
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

  const stats = {
    confirmed: event.participations.filter(p => p.status === 'CONFIRMED').length,
    declined: event.participations.filter(p => p.status === 'DECLINED').length,
    pending: event.participations.filter(p => p.status === 'PENDING').length,
  };

  return NextResponse.json({ ...event, stats });
}

const UpdateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dateTime: z.string().optional(),
  location: z.string().max(200).nullable().optional(),
  eventType: z.string().max(50).nullable().optional(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
});

// PATCH — edit event (admin only)
export async function PATCH(req: NextRequest, { params }: { params: { eventId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 });

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

  if (parsed.data.status === 'CANCELLED') {
    await logAudit(ctx, { action: AuditAction.EVENT_CANCELLED, entity: 'Event', entityId: params.eventId });
  }

  return NextResponse.json(updated);
}

// DELETE — delete event (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { eventId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const event = await prisma.event.findFirst({ where: { id: params.eventId, tenantId: ctx.tenantId } });
  if (!event) return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });

  // Soft delete — cancel instead of delete to preserve data
  await prisma.event.update({ where: { id: params.eventId }, data: { status: 'CANCELLED' } });
  await logAudit(ctx, { action: AuditAction.EVENT_CANCELLED, entity: 'Event', entityId: params.eventId });

  return NextResponse.json({ message: 'Event cancelled' });
}
