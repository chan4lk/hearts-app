import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { canTransition } from '@/app/utils/goalStateMachine';
import { hasMinRole } from '@/lib/rbac';
import { GoalStatus } from '@prisma/client';
import { sanitizeInput, sanitizeInputPreserveNewlines } from '@/lib/securityUtils';
import { checkAndAwardBadges } from '@/lib/badges';
import { z } from 'zod';

export async function GET(_req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const goal = await prisma.goal.findFirst({
    where: { id: params.goalId, tenantId: ctx.tenantId },
    include: {
      owner: { select: { id: true, name: true, email: true, department: true, managerId: true } },
      assigner: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { goal: { select: { id: true } } },
      },
    },
  });

  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(goal);
}

const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeInput)
    .refine((s) => s.length > 0, 'Title cannot be empty').optional(),
  description: z.string().max(2000).transform(sanitizeInputPreserveNewlines).nullable().optional(),
  category: z.string().max(50).transform(sanitizeInput).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
});

type UpdateFields = z.infer<typeof UpdateGoalSchema>;

function canEdit(ctx: { userId: string; userRole: string }, goal: { ownerId: string; status: GoalStatus; owner?: { managerId: string | null } }, fields: UpdateFields): { ok: true } | { ok: false; reason: string } {
  const isOwner = goal.ownerId === ctx.userId;
  const isAdmin = ctx.userRole === 'ADMIN';
  const isManagerOfOwner = ctx.userRole === 'MANAGER' && goal.owner?.managerId === ctx.userId;

  if (isAdmin) return { ok: true };

  const editingContent =
    fields.title !== undefined || fields.description !== undefined || fields.targetDate !== undefined;
  const editingProgress = fields.progress !== undefined;
  const editingStatus = fields.status !== undefined;

  if (editingContent) {
    const openStatuses: GoalStatus[] = ['DRAFT', 'NEEDS_REVISION'];
    if (isOwner && openStatuses.includes(goal.status)) return { ok: true };
    if (isManagerOfOwner) return { ok: true };
    return { ok: false, reason: 'You can only edit this goal while it is DRAFT or NEEDS_REVISION.' };
  }

  if (editingProgress) {
    if (isOwner && goal.status === 'ACTIVE') return { ok: true };
    if (isManagerOfOwner) return { ok: true };
    return { ok: false, reason: 'Progress can only be updated by the owner while ACTIVE.' };
  }

  if (editingStatus) {
    const ownerAllowed: Record<GoalStatus, GoalStatus[]> = {
      DRAFT: ['PENDING', 'CLOSED'],
      NEEDS_REVISION: ['PENDING', 'CLOSED'],
      ACTIVE: ['COMPLETED'],
      PENDING: ['CLOSED'],
      ON_HOLD: [],
      BLOCKED: [],
      COMPLETED: [],
      CLOSED: [],
    };
    if (isOwner && ownerAllowed[goal.status].includes(fields.status!)) return { ok: true };
    if (isManagerOfOwner) return { ok: true };
    return { ok: false, reason: 'You are not allowed to change this goal to that status.' };
  }

  return { ok: true };
}

export async function PATCH(req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateGoalSchema.safeParse(body);
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

  const permission = canEdit(ctx, goal, parsed.data);
  if (!permission.ok) {
    return NextResponse.json({ error: permission.reason, code: 'FORBIDDEN' }, { status: 403 });
  }

  // ── Admin self-goal auto-approval ────────────────────────────────
  // If the caller is an admin with no manager above them (top of the
  // hierarchy), and they're submitting their OWN draft goal for approval,
  // there's nobody to approve it — so skip PENDING and activate directly.
  // A dedicated GOAL_SELF_APPROVED audit entry preserves the paper trail.
  let autoApproved = false;
  if (
    parsed.data.status === 'PENDING' &&
    goal.status === 'DRAFT' &&
    goal.ownerId === ctx.userId &&
    ctx.userRole === 'ADMIN' &&
    !goal.owner?.managerId
  ) {
    parsed.data.status = 'ACTIVE';
    autoApproved = true;
  }

  if (parsed.data.status && !canTransition(goal.status, parsed.data.status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${goal.status} to ${parsed.data.status}`, code: 'CONFLICT' },
      { status: 409 }
    );
  }

  const before = { title: goal.title, description: goal.description, targetDate: goal.targetDate, progress: goal.progress, status: goal.status };

  const updated = await prisma.goal.update({
    where: { id: params.goalId },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category || null }),
      ...(parsed.data.targetDate !== undefined && { targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null }),
      ...(parsed.data.progress !== undefined && { progress: parsed.data.progress }),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    },
    include: {
      owner: { select: { id: true, name: true } },
      assigner: { select: { id: true, name: true } },
    },
  });

  if (parsed.data.status) {
    if (autoApproved) {
      // Dedicated audit trail for the admin self-approval exception so
      // another admin can retroactively see what was auto-activated.
      await logAudit(ctx, {
        action: AuditAction.GOAL_SELF_APPROVED,
        entity: 'Goal',
        entityId: goal.id,
        details: { from: 'DRAFT', to: 'ACTIVE', reason: 'admin_no_manager' },
      });
    } else {
      const actionMap: Partial<Record<GoalStatus, string>> = {
        PENDING: AuditAction.GOAL_SUBMITTED,
        COMPLETED: AuditAction.GOAL_COMPLETED,
        CLOSED: AuditAction.GOAL_CLOSED,
      };
      const action = actionMap[parsed.data.status];
      if (action) {
        await logAudit(ctx, { action, entity: 'Goal', entityId: goal.id, details: { from: goal.status, to: parsed.data.status } });
      }
    }
    if (parsed.data.status === 'COMPLETED' && goal.status !== 'COMPLETED') {
      checkAndAwardBadges(goal.ownerId, ctx.tenantId, 'GOAL_COMPLETED').catch(() => {});
    }
  }

  const contentChanged =
    (parsed.data.title !== undefined && parsed.data.title !== goal.title) ||
    (parsed.data.description !== undefined && parsed.data.description !== goal.description) ||
    (parsed.data.targetDate !== undefined);
  if (contentChanged) {
    await logAudit(ctx, {
      action: AuditAction.GOAL_UPDATED,
      entity: 'Goal',
      entityId: goal.id,
      details: {
        before: { title: before.title, description: before.description, targetDate: before.targetDate },
        after: { title: updated.title, description: updated.description, targetDate: updated.targetDate },
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const goal = await prisma.goal.findFirst({
    where: { id: params.goalId, tenantId: ctx.tenantId },
  });
  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });

  const isAdmin = hasMinRole(ctx, 'ADMIN');
  const isOwner = goal.ownerId === ctx.userId;

  if (!isAdmin) {
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the owner or an admin can delete this goal.', code: 'FORBIDDEN' }, { status: 403 });
    }
    if (goal.status !== 'DRAFT') {
      return NextResponse.json(
        {
          error: 'Only DRAFT goals can be deleted. Close it instead to keep history.',
          code: 'CONFLICT',
        },
        { status: 409 }
      );
    }
  }

  await prisma.goal.delete({ where: { id: goal.id } });

  await logAudit(ctx, {
    action: AuditAction.GOAL_DELETED,
    entity: 'Goal',
    entityId: goal.id,
    details: { title: goal.title, status: goal.status, ownerId: goal.ownerId, deletedByAdmin: isAdmin && !isOwner },
  });

  return NextResponse.json({ success: true });
}
