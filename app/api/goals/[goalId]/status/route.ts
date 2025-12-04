import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Employees can update APPROVED goals to progress statuses
    // Manager-assigned goals start as APPROVED, so employees can start immediately
    // Employees can also update COMPLETED goals back to other statuses if needed
    if (isEmployee) {
      if (goal.status !== 'APPROVED' && goal.status !== 'IN_PROGRESS' && goal.status !== 'ON_HOLD' && goal.status !== 'BLOCKED' && goal.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Status can only be updated for approved, in-progress, on-hold, blocked, or completed goals' },
          { status: 400 }
        );
      }
      // Employees can set progress-related statuses from APPROVED or update existing progress statuses (including COMPLETED)
      const employeeAllowedStatuses = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
      if (!employeeAllowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status for employee. Allowed: ${employeeAllowedStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Managers/Admins can approve/reject/modify DRAFT or PENDING goals, or update APPROVED/IN_PROGRESS goals
    if (isManagerOrAdmin) {
      if (goal.status === 'DRAFT' || goal.status === 'PENDING') {
        // Managers can approve, reject, or request modifications for DRAFT or PENDING goals
        if (status !== 'APPROVED' && status !== 'REJECTED' && status !== 'MODIFIED') {
          return NextResponse.json(
            { error: 'Managers can only approve, reject, or modify draft/pending goals' },
            { status: 400 }
          );
        }
      } else if (goal.status === 'APPROVED' || goal.status === 'IN_PROGRESS' || goal.status === 'ON_HOLD' || goal.status === 'BLOCKED' || goal.status === 'COMPLETED') {
        // Managers can update approved/in-progress/completed goals to other progress statuses
        const managerAllowedStatuses = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
        if (!managerAllowedStatuses.includes(status)) {
          return NextResponse.json(
            { error: `Invalid status for manager. Allowed: ${managerAllowedStatuses.join(', ')}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Managers can only update draft, pending, approved, in-progress, or completed goals' },
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

