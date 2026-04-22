import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole, isManagerOf } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { notifyGoalStatus } from '@/lib/email';
import { z } from 'zod';

const ReviseSchema = z.object({
  comment: z.string().min(1, 'Comment is required when requesting revision').max(1000),
});

// POST — send goal back for revision (requires comment)
export async function POST(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'MANAGER');

  const body = await req.json();
  const parsed = ReviseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A comment is required when requesting revision', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const goal = await prisma.goal.findFirst({
    where: { id: (await params).goalId, tenantId: ctx.tenantId },
    include: { owner: { select: { managerId: true } } },
  });

  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });
  if (goal.status !== 'PENDING') return NextResponse.json({ error: 'Goal is not pending', code: 'CONFLICT' }, { status: 409 });
  if (!isManagerOf(ctx, goal.owner.managerId)) return NextResponse.json({ error: 'Not the assigned manager', code: 'FORBIDDEN' }, { status: 403 });

  const [updated] = await prisma.$transaction([
    prisma.goal.update({ where: { id: (await params).goalId }, data: { status: 'NEEDS_REVISION' } }),
    prisma.goalComment.create({
      data: { tenantId: ctx.tenantId, goalId: (await params).goalId, authorId: ctx.userId, content: parsed.data.comment, type: 'REVISION_REQUEST' },
    }),
  ]);

  await logAudit(ctx, { action: AuditAction.GOAL_REVISION_REQUESTED, entity: 'Goal', entityId: goal.id, details: { comment: parsed.data.comment } });

  notifyGoalStatus(ctx.tenantId, goal.ownerId, goal.title, 'NEEDS_REVISION', parsed.data.comment, goal.id).catch(() => {});

  return NextResponse.json(updated);
}
