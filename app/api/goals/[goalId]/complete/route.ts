import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { canTransition } from '@/app/utils/goalStateMachine';
import { hasMinRole } from '@/lib/rbac';
import { notifyGoalStatus } from '@/lib/email';
import { checkAndAwardBadges } from '@/lib/badges';
import { z } from 'zod';

const CompleteSchema = z.object({
  note: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.findFirst({
    where: { id: (await params).goalId, tenantId: ctx.tenantId },
    include: { owner: { select: { managerId: true } } },
  });
  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });

  const isOwner = goal.ownerId === ctx.userId;
  const isManagerOfOwner = ctx.userRole === 'MANAGER' && goal.owner.managerId === ctx.userId;
  const isAdmin = hasMinRole(ctx, 'ADMIN');
  if (!isOwner && !isManagerOfOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Only the owner, manager, or admin can complete this goal.', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  if (!canTransition(goal.status, 'COMPLETED')) {
    return NextResponse.json(
      { error: `Cannot complete from ${goal.status}. Goal must be ACTIVE.`, code: 'CONFLICT' },
      { status: 409 }
    );
  }

  const ops: any[] = [
    prisma.goal.update({ where: { id: goal.id }, data: { status: 'COMPLETED' } }),
  ];
  if (parsed.data.note && parsed.data.note.trim()) {
    ops.push(
      prisma.goalComment.create({
        data: {
          tenantId: ctx.tenantId,
          goalId: goal.id,
          authorId: ctx.userId,
          content: parsed.data.note.trim(),
          type: 'COMMENT',
        },
      })
    );
  }

  const [updated] = await prisma.$transaction(ops);

  await logAudit(ctx, {
    action: AuditAction.GOAL_COMPLETED,
    entity: 'Goal',
    entityId: goal.id,
    details: { from: goal.status, to: 'COMPLETED', note: parsed.data.note || null },
  });

  notifyGoalStatus(ctx.tenantId, goal.ownerId, goal.title, 'COMPLETED', parsed.data.note || undefined, goal.id).catch(() => {});

  // Award any newly-unlocked badges (fire-and-forget; never blocks the response)
  checkAndAwardBadges(goal.ownerId, ctx.tenantId, 'GOAL_COMPLETED').catch(() => {});

  return NextResponse.json(updated);
}
