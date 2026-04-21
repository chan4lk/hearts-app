import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { hasMinRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { sanitizeInput, sanitizeInputPreserveNewlines } from '@/lib/securityUtils';
import { checkAndAwardBadges } from '@/lib/badges';
import { GoalStatus } from '@prisma/client';
import { z } from 'zod';

const ListGoalsQuerySchema = z.object({
  status: z.nativeEnum(GoalStatus).optional(),
  ownerId: z.string().optional(),
});

// GET — list goals (scoped by role)
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = ListGoalsQuerySchema.safeParse({
    status: searchParams.get('status') || undefined,
    ownerId: searchParams.get('ownerId') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { status, ownerId } = parsed.data;

  const where: any = { tenantId: ctx.tenantId };

  if (status) where.status = status;

  // Employee sees own goals, Manager sees team, Admin sees all
  if (hasMinRole(ctx, 'ADMIN')) {
    if (ownerId) where.ownerId = ownerId;
  } else if (hasMinRole(ctx, 'MANAGER')) {
    if (ownerId) {
      where.ownerId = ownerId;
    } else {
      // Manager sees own goals + direct reports' goals
      where.OR = [
        { ownerId: ctx.userId },
        { owner: { managerId: ctx.userId } },
      ];
    }
  } else {
    where.ownerId = ctx.userId;
  }

  const goals = await prisma.goal.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, department: true, managerId: true } },
      assigner: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(goals);
}

const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeInput)
    .refine((s) => s.length > 0, 'Title cannot be empty'),
  description: z.string().max(2000).transform(sanitizeInputPreserveNewlines).optional(),
  category: z.string().max(50).transform(sanitizeInput).optional(),
  targetDate: z.string().optional(),
  ownerId: z.string().optional(), // For manager-assigned goals
});

// POST — create goal
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const limited = checkRateLimit(`goals:create:${ctx.userId}`, 30, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await req.json();
  const parsed = CreateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, category, targetDate, ownerId } = parsed.data;
  const isManagerAssigned = ownerId && ownerId !== ctx.userId;

  // Assigning a goal to someone else = they must be a direct report of the
  // caller (same rule for admin — admin assigns themselves as the user's
  // manager via /dashboard/admin/users when they need to intervene).
  if (isManagerAssigned) {
    if (!hasMinRole(ctx, 'MANAGER')) {
      return NextResponse.json({ error: 'Only managers can assign goals', code: 'FORBIDDEN' }, { status: 403 });
    }
    const employee = await prisma.user.findFirst({
      where: { id: ownerId, tenantId: ctx.tenantId },
      select: { id: true, managerId: true, isActive: true },
    });
    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Employee not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    if (employee.managerId !== ctx.userId) {
      return NextResponse.json(
        { error: 'You can only assign goals to users who report to you.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
  }

  const goal = await prisma.goal.create({
    data: {
      tenantId: ctx.tenantId,
      title,
      description: description || null,
      category: category || null,
      targetDate: targetDate ? new Date(targetDate) : null,
      status: isManagerAssigned ? 'PENDING' : 'DRAFT',
      ownerId: ownerId || ctx.userId,
      assignerId: isManagerAssigned ? ctx.userId : null,
    },
    include: {
      owner: { select: { id: true, name: true } },
      assigner: { select: { id: true, name: true } },
    },
  });

  await logAudit(ctx, {
    action: isManagerAssigned ? AuditAction.GOAL_ASSIGNED : AuditAction.GOAL_CREATED,
    entity: 'Goal',
    entityId: goal.id,
    details: { title, ownerId: goal.ownerId, status: goal.status },
  });

  if (isManagerAssigned) {
    checkAndAwardBadges(ctx.userId, ctx.tenantId, 'GOAL_ASSIGNED').catch(() => {});
  }

  return NextResponse.json(goal, { status: 201 });
}
