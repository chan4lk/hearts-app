import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { notifyReviewReady } from '@/lib/email';

// POST — finalize review (immutable)
export async function POST(req: NextRequest, { params }: { params: { reviewId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'MANAGER');

  const review = await prisma.review.findFirst({
    where: { id: params.reviewId, tenantId: ctx.tenantId },
  });

  if (!review) return NextResponse.json({ error: 'Review not found', code: 'NOT_FOUND' }, { status: 404 });
  if (review.isFinalized) return NextResponse.json({ error: 'Review already finalized', code: 'IMMUTABLE' }, { status: 422 });
  if (review.managerId !== ctx.userId && ctx.userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Only the assigned manager can finalize', code: 'FORBIDDEN' }, { status: 403 });
  }

  const updated = await prisma.review.update({
    where: { id: params.reviewId },
    data: { isFinalized: true, finalizedAt: new Date() },
  });

  await logAudit(ctx, { action: AuditAction.REVIEW_FINALIZED, entity: 'Review', entityId: review.id });

  // Get cycle name for email
  const cycle = await prisma.reviewCycle.findUnique({ where: { id: review.reviewCycleId }, select: { name: true } });
  notifyReviewReady(ctx.tenantId, review.employeeId, cycle?.name || 'Performance Review').catch(() => {});

  return NextResponse.json(updated);
}
