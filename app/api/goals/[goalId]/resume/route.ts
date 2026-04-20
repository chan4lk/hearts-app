import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { canTransition } from '@/app/utils/goalStateMachine';
import { hasMinRole } from '@/lib/rbac';
import { z } from 'zod';

const ResumeSchema = z.object({
  note: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = ResumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
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
    return NextResponse.json({ error: 'Only the owner, manager, or admin can resume this goal.', code: 'FORBIDDEN' }, { status: 403 });
  }

  if (!canTransition(goal.status, 'ACTIVE')) {
    return NextResponse.json(
      { error: `Cannot resume from ${goal.status}. Goal must be ON_HOLD or BLOCKED.`, code: 'CONFLICT' },
      { status: 409 }
    );
  }

  const ops: any[] = [prisma.goal.update({ where: { id: goal.id }, data: { status: 'ACTIVE' } })];
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
    action: AuditAction.GOAL_RESUMED,
    entity: 'Goal',
    entityId: goal.id,
    details: { from: goal.status, to: 'ACTIVE', note: parsed.data.note || null },
  });

  return NextResponse.json(updated);
}
