import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET a specific goal
export async function GET(req: Request, { params }: { params: { goalId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
        employeeId: session.user.id,
        status: { not: 'DELETED' }
      },
      include: {
        employee: true,
        createdBy: true,
        updatedBy: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

// PATCH to update goal status (for managers)
export async function PATCH(request: Request, { params }: { params: { goalId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();

    // Check if the goal exists
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: { 
        manager: true,
        employee: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if the user is the employee of this goal
    if (goal.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the goal status
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        status,
        updatedAt: new Date(),
        updatedById: session.user.id
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

// PUT to update goal details
export async function PUT(req: Request, { params }: { params: { goalId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, dueDate } = await req.json();

    // Check if the goal exists
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
        status: { not: 'DELETED' }
      },
      include: {
        manager: true,
        employee: true
      }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check authorization
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    const isGoalManager = existingGoal.managerId === session.user.id;
    const isGoalEmployee = existingGoal.employeeId === session.user.id;

    // Only allow updates if:
    // 1. User is admin/manager and goal is in DRAFT or PENDING state
    // 2. User is the employee and goal is in DRAFT state
    if (
      !isAdminOrManager && 
      !(isGoalEmployee && existingGoal.status === 'DRAFT')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to update this goal' },
        { status: 403 }
      );
    }

    const goal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate: new Date(dueDate),
        status: isAdminOrManager ? existingGoal.status : 'PENDING',
        updatedById: session.user.id
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

// DELETE (soft delete) a goal
export async function DELETE(req: Request, { params }: { params: { goalId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the goal exists
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
        status: { not: 'DELETED' }
      },
      include: {
        manager: true,
        employee: true
      }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check authorization
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    const isGoalManager = existingGoal.managerId === session.user.id;
    const isGoalEmployee = existingGoal.employeeId === session.user.id;

    // Only allow deletion if:
    // 1. User is admin/manager and goal is in DRAFT or PENDING state
    // 2. User is the employee and goal is in DRAFT state
    if (
      !isAdminOrManager && 
      !(isGoalEmployee && existingGoal.status === 'DRAFT')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this goal' },
        { status: 403 }
      );
    }

    const goal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        deletedById: session.user.id,
        updatedAt: new Date(),
        updatedById: session.user.id
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Goal Deleted Successfully',
      goal
    });
  } catch (error) {
    console.error('Error Deleting Goal:', error);
    return NextResponse.json({ error: 'Failed to Delete Goal' }, { status: 500 });
  }
} 