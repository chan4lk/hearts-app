import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { hasMinRole } from '@/lib/rbac';
import { z } from 'zod';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const review = await prisma.review.findFirst({
    where: { id: (await params).reviewId, tenantId: ctx.tenantId },
    include: {
      employee: { select: { id: true, name: true, email: true, department: true } },
      manager: { select: { id: true, name: true } },
      reviewCycle: true,
    },
  });

  if (!review) return NextResponse.json({ error: 'Review not found', code: 'NOT_FOUND' }, { status: 404 });

  const isOwner = review.employeeId === ctx.userId;
  const isManager = review.managerId === ctx.userId;
  const isAdmin = hasMinRole(ctx, 'ADMIN');
  if (!isOwner && !isManager && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const goals = await prisma.goal.findMany({
    where: {
      tenantId: ctx.tenantId,
      ownerId: review.employeeId,
      updatedAt: {
        gte: review.reviewCycle.startDate,
        lte: review.reviewCycle.endDate,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const hearts = await prisma.heart.findMany({
    where: {
      tenantId: ctx.tenantId,
      receiverId: review.employeeId,
      createdAt: { gte: review.reviewCycle.startDate, lte: review.reviewCycle.endDate },
    },
    include: {
      sender: { select: { name: true } },
      valueTag: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ ...review, evidence: { goals, hearts } });
}

const UpdateReviewSchema = z.object({
  selfComments: z.string().max(5000).optional(),
  selfRating: z.number().min(1).max(5).optional(),
  managerComments: z.string().max(5000).optional(),
  managerRating: z.number().min(1).max(5).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const review = await prisma.review.findFirst({
    where: { id: (await params).reviewId, tenantId: ctx.tenantId },
  });
  if (!review) return NextResponse.json({ error: 'Review not found', code: 'NOT_FOUND' }, { status: 404 });
  if (review.isFinalized) {
    return NextResponse.json({ error: 'Review is finalized and cannot be edited', code: 'IMMUTABLE' }, { status: 422 });
  }

  const body = await req.json();
  const parsed = UpdateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const isOwner = review.employeeId === ctx.userId;
  const isManager = review.managerId === ctx.userId;
  const isAdmin = hasMinRole(ctx, 'ADMIN');

  const touchingSelf = parsed.data.selfComments !== undefined || parsed.data.selfRating !== undefined;
  const touchingManager = parsed.data.managerComments !== undefined || parsed.data.managerRating !== undefined;

  if (touchingSelf && !isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Only the employee can edit the self-review.', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  if (touchingManager && !isManager && !isAdmin) {
    return NextResponse.json(
      { error: 'Only the assigned manager can edit the manager review.', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }
  if (!touchingSelf && !touchingManager) {
    return NextResponse.json({ error: 'No fields to update', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const data: any = {};
  const selfFirstSubmit = touchingSelf && !review.selfSubmittedAt;
  const managerFirstSubmit = touchingManager && !review.managerSubmittedAt;

  if (parsed.data.selfComments !== undefined) {
    data.selfComments = parsed.data.selfComments;
    if (selfFirstSubmit) data.selfSubmittedAt = new Date();
  }
  if (parsed.data.selfRating !== undefined) data.selfRating = parsed.data.selfRating;
  if (parsed.data.managerComments !== undefined) {
    data.managerComments = parsed.data.managerComments;
    if (managerFirstSubmit) data.managerSubmittedAt = new Date();
  }
  if (parsed.data.managerRating !== undefined) data.managerRating = parsed.data.managerRating;

  const updated = await prisma.review.update({ where: { id: (await params).reviewId }, data });

  if (selfFirstSubmit) {
    await logAudit(ctx, {
      action: AuditAction.SELF_REVIEW_SUBMITTED,
      entity: 'Review',
      entityId: review.id,
      details: { rating: updated.selfRating, cycleId: review.reviewCycleId },
    });
  }
  if (managerFirstSubmit) {
    await logAudit(ctx, {
      action: AuditAction.MANAGER_REVIEW_SUBMITTED,
      entity: 'Review',
      entityId: review.id,
      details: { rating: updated.managerRating, cycleId: review.reviewCycleId, employeeId: review.employeeId },
    });
  }

  return NextResponse.json(updated);
}
