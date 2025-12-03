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

    // Validate status - employees can update to these statuses
    const allowedStatuses = ['IN_PROGRESS', 'NOT_STARTED', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
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

    // Only the employee can update status
    if (goal.employeeId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the assigned employee can update goal status' },
        { status: 403 }
      );
    }

    // Allow status updates for PENDING or APPROVED goals (manager-assigned or employee-created)
    if (goal.status !== 'APPROVED' && goal.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Status can only be updated for pending or approved goals' },
        { status: 400 }
      );
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

