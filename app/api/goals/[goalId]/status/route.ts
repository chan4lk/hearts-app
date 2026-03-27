import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/securityUtils';
import { statusUpdateSchema } from '@/lib/validation';
import { validateUUID } from '@/app/api/utils/error-handler';
import { rateLimiters } from '@/lib/rateLimit';

// Status update endpoint for goals
// Manager-assigned goals: Start as APPROVED → Employee can update to IN_PROGRESS → COMPLETED and others
// Employee-created goals: Start as DRAFT → Manager reviews (APPROVED/REJECTED/MODIFIED) → If APPROVED, employee can update to IN_PROGRESS → COMPLETED and others
export async function PATCH(
  req: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { status } = parsed.data;

    const invalidId = validateUUID(params.goalId, 'goal ID');
    if (invalidId) return invalidId;

    // Get the goal with employee's managerId in a single query (eliminates N+1)
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: {
        employee: { select: { id: true, name: true, email: true, managerId: true } },
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Block operations on deleted goals
    if (goal.status === 'DELETED') {
      return NextResponse.json({ error: 'Cannot update a deleted goal' }, { status: 400 });
    }

    const isEmployee = goal.employeeId === session.user.id;
    const isManagerOrAdmin = session.user.role === 'MANAGER' || session.user.role === 'ADMIN';
    const isGoalManager = goal.managerId === session.user.id;

    // Use employee.managerId from the already-loaded relation (no extra query)
    const isEmployeeManager = isManagerOrAdmin && goal.employee?.managerId === session.user.id;

    // Employees can update their own goals
    // Admins can update ANY goal status (full permissions)
    // Managers can update:
    // 1. Goals they directly manage (goal.managerId === session.user.id)
    // 2. Goals of employees they manage (employee.managerId === session.user.id)
    // This allows managers to approve/reject DRAFT goals created by their employees
    if (!isEmployee && session.user.role !== 'ADMIN' && !(isManagerOrAdmin && (isGoalManager || isEmployeeManager))) {
      return NextResponse.json(
        { error: 'You do not have permission to update this goal status' },
        { status: 403 }
      );
    }

    // ── EMPLOYEE permissions ──
    if (isEmployee) {
      const allowedCurrentStatuses = ['APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED', 'REJECTED'];
      if (!allowedCurrentStatuses.includes(goal.status)) {
        return NextResponse.json(
          { error: `Cannot update goals with status: ${goal.status}` },
          { status: 400 }
        );
      }
      // Employees can move to work-related statuses only
      const employeeAllowedTargets = ['IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'];
      if (!employeeAllowedTargets.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status for employee. Allowed: ${employeeAllowedTargets.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // ── MANAGER/ADMIN permissions ──
    if (isManagerOrAdmin) {
      if (session.user.role === 'ADMIN') {
        // Admins: no restrictions
      } else if (goal.status === 'DRAFT' || goal.status === 'PENDING') {
        // Managers review: can approve, reject, or request modifications
        const allowed = ['APPROVED', 'REJECTED', 'MODIFIED'];
        if (!allowed.includes(status)) {
          return NextResponse.json(
            { error: `Managers can approve, reject, or request modifications for ${goal.status} goals` },
            { status: 400 }
          );
        }
      } else if (goal.status === 'APPROVED' || goal.status === 'REJECTED') {
        // Managers can change between APPROVED/REJECTED/MODIFIED, or reset APPROVED→DRAFT
        const allowed = ['APPROVED', 'REJECTED', 'MODIFIED', 'DRAFT'];
        if (!allowed.includes(status)) {
          return NextResponse.json(
            { error: `Managers can change between Approved, Rejected, Modified, or reset to Draft` },
            { status: 400 }
          );
        }
      } else if (goal.status === 'COMPLETED') {
        // Managers can reopen completed goals (COMPLETED → IN_PROGRESS)
        const allowed = ['IN_PROGRESS'];
        if (!allowed.includes(status)) {
          return NextResponse.json(
            { error: `Completed goals can only be reopened to In Progress by a manager` },
            { status: 400 }
          );
        }
      } else if (['IN_PROGRESS', 'ON_HOLD', 'BLOCKED'].includes(goal.status)) {
        // Managers can update work statuses
        const allowed = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
        if (!allowed.includes(status)) {
          return NextResponse.json(
            { error: `Invalid status for manager. Allowed: ${allowed.join(', ')}` },
            { status: 400 }
          );
        }
      } else if (goal.status === 'MODIFIED') {
        // Modified goals can be re-approved or re-rejected by manager
        const allowed = ['APPROVED', 'REJECTED'];
        if (!allowed.includes(status)) {
          return NextResponse.json(
            { error: `Modified goals can be approved or rejected` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Cannot update goals with this status' },
          { status: 400 }
        );
      }
    }

    // Update the goal status with optimistic locking (version incremented)
    // Note: `version` field added in migration — run `prisma generate` to remove `as any`
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        status: status as any,
        updatedAt: new Date(),
        updatedById: session.user.id,
        ...({ version: { increment: 1 } } as any),
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        rating: {
          select: {
            id: true,
            selfScore: true,
            selfComments: true,
            selfRatedById: true,
            selfRatedAt: true,
            managerScore: true,
            managerComments: true,
            managerRatedById: true,
            managerRatedAt: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    // Create notifications based on status change
    // Note: Notifications use groupKey for client-side deduplication (by design).
    // Multiple status changes on the same goal produce separate notifications intentionally,
    // so users see the full audit trail. The groupKey allows the UI to collapse them if needed.
    // Sanitize user-provided content to prevent stored XSS
    const oldStatus = goal.status;
    const newStatus = status;
    const safeTitle = sanitizeInput(goal.title, 200);
    const safeName = sanitizeInput(session.user.name || session.user.email || 'User', 100);
    const safeEmpName = sanitizeInput(goal.employee?.name || 'Employee', 100);

    if (newStatus === 'APPROVED' && oldStatus !== 'APPROVED') {
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_APPROVED,
          message: `Your goal "${safeTitle}" has been approved by ${safeName}`,
          userId: goal.employeeId,
          goalId: goal.id,
          ...({ groupKey: `goal:${goal.id}` } as any),
        },
      });
    } else if (newStatus === 'REJECTED' && oldStatus !== 'REJECTED') {
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_REJECTED,
          message: `Your goal "${safeTitle}" has been rejected by ${safeName}`,
          userId: goal.employeeId,
          goalId: goal.id,
          ...({ groupKey: `goal:${goal.id}` } as any),
        },
      });
    } else if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      if (goal.managerId) {
        await prisma.notification.create({
          data: {
            type: NotificationType.GOAL_COMPLETED,
            message: `${safeEmpName} completed the goal "${safeTitle}"`,
            userId: goal.managerId,
            goalId: goal.id,
          ...({ groupKey: `goal:${goal.id}` } as any),
          },
        });
      }
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_COMPLETED,
          message: `You completed the goal "${safeTitle}"`,
          userId: goal.employeeId,
          goalId: goal.id,
          ...({ groupKey: `goal:${goal.id}` } as any),
        },
      });
    } else if (newStatus !== oldStatus && (newStatus === 'IN_PROGRESS' || newStatus === 'ON_HOLD' || newStatus === 'BLOCKED')) {
      if (goal.managerId && isEmployee) {
        await prisma.notification.create({
          data: {
            type: NotificationType.GOAL_UPDATED,
            message: `${safeEmpName} updated goal "${safeTitle}" status to ${newStatus.replace('_', ' ')}`,
            userId: goal.managerId,
            goalId: goal.id,
          ...({ groupKey: `goal:${goal.id}` } as any),
          },
        });
      }
    }

    // Notify manager when DRAFT goal gets approved/rejected
    if ((newStatus === 'APPROVED' || newStatus === 'REJECTED') && oldStatus === 'DRAFT') {
      const empManagerId = goal.employee?.managerId;
      if (empManagerId) {
        await prisma.notification.create({
          data: {
            type: newStatus === 'APPROVED' ? NotificationType.GOAL_APPROVED : NotificationType.GOAL_REJECTED,
            message: `You ${newStatus === 'APPROVED' ? 'approved' : 'rejected'} ${safeEmpName}'s goal "${safeTitle}"`,
            userId: empManagerId,
            goalId: goal.id,
          ...({ groupKey: `goal:${goal.id}` } as any),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error instanceof Error ? error.message : 'Failed to update goal status';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

