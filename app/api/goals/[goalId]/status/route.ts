import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple status update for employees on pending or approved goals
// Allowed statuses: IN_PROGRESS, NOT_STARTED, COMPLETED, ON_HOLD, BLOCKED
// Manager-assigned goals start as PENDING and can be updated directly by employees
// Employee-created goals must be approved first, then can be updated
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

    // Status validation will be done after checking user role and goal status

    // Get the goal
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const isEmployee = goal.employeeId === session.user.id;
    const isManagerOrAdmin = session.user.role === 'MANAGER' || session.user.role === 'ADMIN';
    const isGoalManager = goal.managerId === session.user.id;

    // Employees can update their own goals, managers/admins can update goals they manage
    if (!isEmployee && !(isManagerOrAdmin && isGoalManager)) {
      return NextResponse.json(
        { error: 'You do not have permission to update this goal status' },
        { status: 403 }
      );
    }

    // Employees can update PENDING or APPROVED goals to progress statuses
    if (isEmployee) {
      if (goal.status !== 'APPROVED' && goal.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Status can only be updated for pending or approved goals' },
          { status: 400 }
        );
      }
      // Employees can only set progress-related statuses
      const employeeAllowedStatuses = ['IN_PROGRESS', 'NOT_STARTED', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
      if (!employeeAllowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status for employee. Allowed: ${employeeAllowedStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Managers/Admins can approve/reject PENDING or DRAFT goals, or update APPROVED goals
    if (isManagerOrAdmin) {
      if (goal.status === 'PENDING' || goal.status === 'DRAFT') {
        // Managers can approve or reject
        if (status !== 'APPROVED' && status !== 'REJECTED') {
          return NextResponse.json(
            { error: 'Managers can only approve or reject pending/draft goals' },
            { status: 400 }
          );
        }
      } else if (goal.status === 'APPROVED') {
        // Managers can update approved goals to progress statuses
        const managerAllowedStatuses = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
        if (!managerAllowedStatuses.includes(status)) {
          return NextResponse.json(
            { error: `Invalid status for manager. Allowed: ${managerAllowedStatuses.join(', ')}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Managers can only update pending, draft, or approved goals' },
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
        updatedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    });
  } catch (error) {
    console.error('Error updating goal status:', error);
    return NextResponse.json(
      { error: 'Failed to update goal status' },
      { status: 500 }
    );
  }
}

