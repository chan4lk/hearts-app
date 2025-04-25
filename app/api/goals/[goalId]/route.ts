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

    const { status, managerComments } = await request.json();

    // Check if user is authorized to update the goal
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: { manager: true }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        status,
        managerComments,
        updatedAt: new Date(),
        updatedById: session.user.id
      },
      include: {
        employee: true,
        manager: true,
        createdBy: true,
        updatedBy: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Goal status updated successfully',
      goal: updatedGoal
    });
  } catch (error) {
    console.error('Error updating goal status:', error);
    return NextResponse.json({ error: 'Failed to update goal status' }, { status: 500 });
  }
}

// PUT to update goal details (for employees)
export async function PUT(req: Request, { params }: { params: { goalId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, dueDate } = await req.json();

    // Check if the goal exists and belongs to the user
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
        employeeId: session.user.id,
        status: { not: 'DELETED' }
      }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate: new Date(dueDate),
        status: 'PENDING',
        updatedById: session.user.id
      },
      include: {
        employee: true,
        createdBy: true,
        updatedBy: true
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

    // Check if the goal exists and belongs to the user
    const existingGoal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
        employeeId: session.user.id,
        status: { not: 'DELETED' }
      }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        deletedById: session.user.id,
        updatedAt: new Date(),
        updatedById: session.user.id
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
} 