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

    // Check if manager is the manager of the employee who owns this goal
    // This is important for DRAFT goals created by employees where goal.managerId might be null
    let isEmployeeManager = false;
    if (isManagerOrAdmin && goal.employee) {
      const employeeUser = await prisma.user.findUnique({
        where: { id: goal.employeeId },
        select: { managerId: true }
      });
      isEmployeeManager = employeeUser?.managerId === session.user.id;
    }

    // Employees can update their own goals
    // Managers/Admins can update:
    // 1. Goals they directly manage (goal.managerId === session.user.id)
    // 2. Goals of employees they manage (employee.managerId === session.user.id)
    // This allows managers to approve/reject DRAFT goals created by their employees
    if (!isEmployee && !(isManagerOrAdmin && (isGoalManager || isEmployeeManager))) {
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

    // Managers/Admins can approve/reject DRAFT goals, change APPROVED/REJECTED, or update progress statuses
    if (isManagerOrAdmin) {
      if (goal.status === 'DRAFT') {
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
        const managerAllowedStatuses = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
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

