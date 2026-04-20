import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { CycleStatus, CycleType } from '@prisma/client';
import { z } from 'zod';

export async function GET(_req: NextRequest, { params }: { params: { cycleId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: params.cycleId, tenantId: ctx.tenantId },
    include: {
      reviews: {
        include: {
          employee: { select: { id: true, name: true, department: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { employee: { name: 'asc' } },
      },
    },
  });

  if (!cycle) return NextResponse.json({ error: 'Cycle not found', code: 'NOT_FOUND' }, { status: 404 });

  const stats = {
    total: cycle.reviews.length,
    selfCompleted: cycle.reviews.filter((r) => r.selfSubmittedAt).length,
    managerCompleted: cycle.reviews.filter((r) => r.managerSubmittedAt).length,
    finalized: cycle.reviews.filter((r) => r.isFinalized).length,
  };

  return NextResponse.json({ ...cycle, stats });
}

const UpdateCycleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.nativeEnum(CycleType).optional(),
  status: z.nativeEnum(CycleStatus).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { cycleId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = UpdateCycleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: params.cycleId, tenantId: ctx.tenantId },
  });
  if (!cycle) return NextResponse.json({ error: 'Cycle not found', code: 'NOT_FOUND' }, { status: 404 });

  const start = parsed.data.startDate ? new Date(parsed.data.startDate) : cycle.startDate;
  const end = parsed.data.endDate ? new Date(parsed.data.endDate) : cycle.endDate;
  if (start >= end) {
    return NextResponse.json(
      { error: 'End date must be after start date', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const updated = await prisma.reviewCycle.update({
    where: { id: cycle.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.startDate !== undefined && { startDate: new Date(parsed.data.startDate) }),
      ...(parsed.data.endDate !== undefined && { endDate: new Date(parsed.data.endDate) }),
      ...(parsed.data.type !== undefined && { type: parsed.data.type }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    },
  });

  let action: string = AuditAction.REVIEW_CYCLE_UPDATED;
  if (parsed.data.status && parsed.data.status !== cycle.status) {
    if (parsed.data.status === 'ACTIVE') action = AuditAction.REVIEW_CYCLE_ACTIVATED;
    else if (parsed.data.status === 'COMPLETED') action = AuditAction.REVIEW_CYCLE_COMPLETED;
    else if (parsed.data.status === 'CLOSED') action = AuditAction.REVIEW_CYCLE_CLOSED;
  }

  await logAudit(ctx, {
    action,
    entity: 'ReviewCycle',
    entityId: cycle.id,
    details: {
      before: { name: cycle.name, startDate: cycle.startDate, endDate: cycle.endDate, type: cycle.type, status: cycle.status },
      after: { name: updated.name, startDate: updated.startDate, endDate: updated.endDate, type: updated.type, status: updated.status },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { cycleId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: params.cycleId, tenantId: ctx.tenantId },
    include: {
      reviews: {
        select: { id: true, selfSubmittedAt: true, managerSubmittedAt: true, isFinalized: true },
      },
    },
  });
  if (!cycle) return NextResponse.json({ error: 'Cycle not found', code: 'NOT_FOUND' }, { status: 404 });

  const submittedCount = cycle.reviews.filter(
    (r) => r.selfSubmittedAt || r.managerSubmittedAt || r.isFinalized
  ).length;
  if (submittedCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${submittedCount} review${submittedCount === 1 ? '' : 's'} in this cycle already ${submittedCount === 1 ? 'has' : 'have'} submitted data. Close the cycle instead to preserve history.`,
        code: 'IN_USE',
        submittedCount,
      },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.review.deleteMany({ where: { reviewCycleId: cycle.id } }),
    prisma.reviewCycle.delete({ where: { id: cycle.id } }),
  ]);

  await logAudit(ctx, {
    action: AuditAction.REVIEW_CYCLE_DELETED,
    entity: 'ReviewCycle',
    entityId: cycle.id,
    details: {
      name: cycle.name,
      type: cycle.type,
      status: cycle.status,
      reviewsDeleted: cycle.reviews.length,
    },
  });

  return NextResponse.json({ success: true });
}
