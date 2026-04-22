import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole, isManagerOf } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { notifyGoalStatus } from '@/lib/email';

// POST — approve a pending goal
export async function POST(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'MANAGER');

  const body = await req.json().catch(() => ({}));
  const feedback = body.feedback || null;

  const goal = await prisma.goal.findFirst({
    where: { id: (await params).goalId, tenantId: ctx.tenantId },
    include: { owner: { select: { managerId: true } } },
  });

  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });
  if (goal.status !== 'PENDING') return NextResponse.json({ error: 'Goal is not pending', code: 'CONFLICT' }, { status: 409 });
  if (!isManagerOf(ctx, goal.owner.managerId)) return NextResponse.json({ error: 'Not the assigned manager', code: 'FORBIDDEN' }, { status: 403 });

  const [updated] = await prisma.$transaction([
    prisma.goal.update({ where: { id: (await params).goalId }, data: { status: 'ACTIVE' } }),
    ...(feedback ? [prisma.goalComment.create({
      data: { tenantId: ctx.tenantId, goalId: (await params).goalId, authorId: ctx.userId, content: feedback, type: 'APPROVAL' },
    })] : []),
  ]);

  await logAudit(ctx, { action: AuditAction.GOAL_APPROVED, entity: 'Goal', entityId: goal.id, details: { feedback } });

  // Email notification to goal owner
  notifyGoalStatus(ctx.tenantId, goal.ownerId, goal.title, 'ACTIVE', feedback, goal.id).catch(() => {});

  return NextResponse.json(updated);
}
