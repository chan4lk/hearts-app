import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';

// Status update endpoint for goals
// Manager-assigned goals: Start as APPROVED → Employee can update to IN_PROGRESS → COMPLETED and others
// Employee-created goals: Start as DRAFT → Manager reviews (APPROVED/REJECTED/MODIFIED) → If APPROVED, employee can update to IN_PROGRESS → COMPLETED and others
export async function PATCH(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Removed: Sensitive data logging (userId, role)

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

    // Employees can update APPROVED goals to progress statuses
    // Manager-assigned goals start as APPROVED, so employees can start immediately
    // Employees can also update COMPLETED goals back to other statuses if needed
    if (isEmployee) {
      // Allow employees to update from APPROVED or any work/progress status
      const allowedCurrentStatuses = ['APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED', 'NOT_STARTED', 'REJECTED'];
      if (!allowedCurrentStatuses.includes(goal.status)) {
        return NextResponse.json(
          { error: 'Status can only be updated for approved, in-progress, on-hold, blocked, completed, not-started, or rejected goals' },
          { status: 400 }
        );
      }
      // Employees can set progress-related statuses from APPROVED or update existing progress statuses
      const employeeAllowedStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'];
      if (!employeeAllowedStatuses.includes(status)) {
        logger.log('Employee status update rejected', 'Warning', { currentStatus: goal.status, requestedStatus: status });
        return NextResponse.json(
          { error: `Invalid status for employee. Allowed: ${employeeAllowedStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Managers/Admins can approve/reject DRAFT goals, change APPROVED/REJECTED, or update progress statuses
    // Admins have full permissions to update any status
    if (isManagerOrAdmin) {
      // Admins can update any status to any status
      if (session.user.role === 'ADMIN') {
        // No restrictions for admins - they can update any status
      } else if (goal.status === 'DRAFT') {
        // Managers can approve or reject DRAFT goals
        if (status !== 'APPROVED' && status !== 'REJECTED') {
          return NextResponse.json(
            { error: 'Managers can only approve or reject draft goals' },
            { status: 400 }
          );
        }
      } else if (goal.status === 'APPROVED' || goal.status === 'REJECTED') {
        // Managers can change between APPROVED and REJECTED multiple times
        if (status !== 'APPROVED' && status !== 'REJECTED') {
          return NextResponse.json(
            { error: 'Managers can only change between Approved and Rejected status' },
            { status: 400 }
          );
        }
      } else if (goal.status === 'IN_PROGRESS' || goal.status === 'ON_HOLD' || goal.status === 'BLOCKED' || goal.status === 'COMPLETED') {
        // Managers can update progress statuses
        const managerAllowedStatuses = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED', 'NOT_STARTED'];
        if (!managerAllowedStatuses.includes(status)) {
          return NextResponse.json(
            { error: `Invalid status for manager. Allowed: ${managerAllowedStatuses.join(', ')}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Managers can only update draft, approved, rejected, or progress status goals' },
          { status: 400 }
        );
      }
    }

    // Update the goal status
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        status: status as any, // Cast to any to allow new status values
        updatedAt: new Date(),
        updatedById: session.user.id
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
    const oldStatus = goal.status;
    const newStatus = status;
    const actorName = session.user.name || session.user.email || 'User';

    // Notify employee about status changes
    if (newStatus === 'APPROVED' && oldStatus !== 'APPROVED') {
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_APPROVED,
          message: `Your goal "${goal.title}" has been approved by ${actorName}`,
          userId: goal.employeeId,
          goalId: goal.id,
        },
      });
    } else if (newStatus === 'REJECTED' && oldStatus !== 'REJECTED') {
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_REJECTED,
          message: `Your goal "${goal.title}" has been rejected by ${actorName}`,
          userId: goal.employeeId,
          goalId: goal.id,
        },
      });
    } else if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      // Notify manager when employee completes goal
      if (goal.managerId) {
        await prisma.notification.create({
          data: {
            type: NotificationType.GOAL_COMPLETED,
            message: `${goal.employee?.name || 'Employee'} completed the goal "${goal.title}"`,
            userId: goal.managerId,
            goalId: goal.id,
          },
        });
      }
      // Also notify employee
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_COMPLETED,
          message: `You completed the goal "${goal.title}"`,
          userId: goal.employeeId,
          goalId: goal.id,
        },
      });
    } else if (newStatus !== oldStatus && (newStatus === 'IN_PROGRESS' || newStatus === 'ON_HOLD' || newStatus === 'BLOCKED')) {
      // Notify manager about progress status changes
      if (goal.managerId && isEmployee) {
        await prisma.notification.create({
          data: {
            type: NotificationType.GOAL_UPDATED,
            message: `${goal.employee?.name || 'Employee'} updated goal "${goal.title}" status to ${newStatus.replace('_', ' ')}`,
            userId: goal.managerId,
            goalId: goal.id,
          },
        });
      }
    }

    // Notify manager when employee creates DRAFT goal and it gets approved/rejected
    // Use employee.managerId from the already-loaded relation (no extra query)
    if ((newStatus === 'APPROVED' || newStatus === 'REJECTED') && oldStatus === 'DRAFT') {
      const empManagerId = goal.employee?.managerId;
      if (empManagerId) {
        await prisma.notification.create({
          data: {
            type: newStatus === 'APPROVED' ? NotificationType.GOAL_APPROVED : NotificationType.GOAL_REJECTED,
            message: `You ${newStatus === 'APPROVED' ? 'approved' : 'rejected'} ${goal.employee?.name || 'employee'}'s goal "${goal.title}"`,
            userId: empManagerId,
            goalId: goal.id,
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

