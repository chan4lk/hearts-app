import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { canTransition } from '@/app/utils/goalStateMachine';
import { hasMinRole } from '@/lib/rbac';
import { z } from 'zod';

const HoldSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const parsed = HoldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A reason is required', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.findFirst({
    where: { id: params.goalId, tenantId: ctx.tenantId },
    include: { owner: { select: { managerId: true } } },
  });
  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });

  const isOwner = goal.ownerId === ctx.userId;
  const isManagerOfOwner = ctx.userRole === 'MANAGER' && goal.owner.managerId === ctx.userId;
  const isAdmin = hasMinRole(ctx, 'ADMIN');
  if (!isOwner && !isManagerOfOwner && !isAdmin) {
    return NextResponse.json({ error: 'Only the owner, manager, or admin can put this goal on hold.', code: 'FORBIDDEN' }, { status: 403 });
  }

  if (!canTransition(goal.status, 'ON_HOLD')) {
    return NextResponse.json(
      { error: `Cannot place on hold from ${goal.status}. Goal must be ACTIVE.`, code: 'CONFLICT' },
      { status: 409 }
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.goal.update({ where: { id: goal.id }, data: { status: 'ON_HOLD' } }),
    prisma.goalComment.create({
      data: {
        tenantId: ctx.tenantId,
        goalId: goal.id,
        authorId: ctx.userId,
        content: parsed.data.reason,
        type: 'HOLD_REASON',
      },
    }),
  ]);

  await logAudit(ctx, {
    action: AuditAction.GOAL_PLACED_ON_HOLD,
    entity: 'Goal',
    entityId: goal.id,
    details: { from: goal.status, to: 'ON_HOLD', reason: parsed.data.reason },
  });

  return NextResponse.json(updated);
}
