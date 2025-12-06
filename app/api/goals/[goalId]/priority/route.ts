import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Priority update endpoint for goals
export async function PATCH(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priority } = await req.json();
    
    if (!priority) {
      return NextResponse.json({ error: 'Priority is required' }, { status: 400 });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

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
    let isEmployeeManager = false;
    if (isManagerOrAdmin && goal.employee) {
      const employeeUser = await prisma.user.findUnique({
        where: { id: goal.employeeId },
        select: { managerId: true }
      });
      isEmployeeManager = employeeUser?.managerId === session.user.id;
    }

    // Employees can update priority of their own goals
    // Admins can update ANY goal priority (full permissions)
    // Managers can update priority of goals they manage
    if (!isEmployee && session.user.role !== 'ADMIN' && !(isManagerOrAdmin && (isGoalManager || isEmployeeManager))) {
      return NextResponse.json(
        { error: 'You do not have permission to update this goal priority' },
        { status: 403 }
      );
    }

    // Update the goal priority
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        priority: priority as any,
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
    console.error('Error updating goal priority:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update goal priority';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

