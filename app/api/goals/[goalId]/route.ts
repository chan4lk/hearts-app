import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { canTransition } from '@/app/utils/goalStateMachine';
import { GoalStatus } from '@prisma/client';
import { z } from 'zod';

// GET — goal detail
export async function GET(req: NextRequest, { params }: { params: { goalId: string } }) {
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
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  targetDate: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
});

// PATCH — update goal (progress, status, fields)
export async function PATCH(req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const goal = await prisma.goal.findFirst({
    where: { id: params.goalId, tenantId: ctx.tenantId },
  });
  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });

  // Validate state transition
  if (parsed.data.status && !canTransition(goal.status, parsed.data.status)) {
    return NextResponse.json({
      error: `Cannot transition from ${goal.status} to ${parsed.data.status}`,
      code: 'CONFLICT',
    }, { status: 409 });
  }

  const updated = await prisma.goal.update({
    where: { id: params.goalId },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
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
    const actionMap: Record<string, string> = {
      PENDING: AuditAction.GOAL_SUBMITTED,
      COMPLETED: AuditAction.GOAL_COMPLETED,
      CLOSED: AuditAction.GOAL_CLOSED,
    };
    const action = actionMap[parsed.data.status];
    if (action) {
      await logAudit(ctx, { action, entity: 'Goal', entityId: goal.id, details: { from: goal.status, to: parsed.data.status } });
    }
  }

  return NextResponse.json(updated);
}
