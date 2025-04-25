import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = params;
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, description, dueDate, employeeId, category, status } = body;

    // Validate required fields
    if (!title || !description || !dueDate || !employeeId || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the goal exists
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { 
        employee: true,
        manager: true
      }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // For managers, check if they are the manager of the employee
    if (session.user.role === 'MANAGER') {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { managerId: true }
      });

      if (!employee || employee.managerId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only update goals for your assigned employees' },
          { status: 403 }
        );
      }
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        employeeId,
        category,
        status: status || existingGoal.status,
        updatedAt: new Date()
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

    if (!updatedGoal) {
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    // Return the updated goal with all necessary fields
    return NextResponse.json({
      id: updatedGoal.id,
      title: updatedGoal.title,
      description: updatedGoal.description,
      dueDate: updatedGoal.dueDate.toISOString(),
      category: updatedGoal.category,
      status: updatedGoal.status,
      employee: updatedGoal.employee,
      manager: updatedGoal.manager
    });

  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the goal to check ownership
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: {
        employee: true,
        manager: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if user is authorized to delete the goal
    const isAdmin = session.user.role === 'ADMIN';
    const isManager = session.user.role === 'MANAGER';
    const isEmployee = session.user.role === 'EMPLOYEE';
    const isGoalManager = goal.managerId === session.user.id;
    const isGoalEmployee = goal.employeeId === session.user.id;

    if (!isAdmin && !isManager && !isEmployee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && !isGoalManager && !isGoalEmployee) {
      return NextResponse.json({ error: 'You are not authorized to delete this goal' }, { status: 403 });
    }

    // Delete the goal
    await prisma.goal.delete({
      where: { id: params.goalId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete goal',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, dueDate, employeeId, category } = body;

    // Validate required fields
    if (!title || !description || !dueDate || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the goal to check ownership
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: {
        employee: true,
        manager: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if user is authorized to update the goal
    const isAdmin = session.user.role === 'ADMIN';
    const isManager = session.user.role === 'MANAGER';
    const isGoalManager = goal.managerId === session.user.id;

    if (!isAdmin && !isManager && !isGoalManager) {
      return NextResponse.json({ error: 'You are not authorized to update this goal' }, { status: 403 });
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate),
        category: category || 'PROFESSIONAL',
        employee: { connect: { id: employeeId } },
        updatedAt: new Date()
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

    // Transform the goal to match frontend expectations
    const transformedGoal = {
      id: updatedGoal.id,
      title: updatedGoal.title,
      description: updatedGoal.description,
      dueDate: updatedGoal.dueDate.toISOString(),
      status: updatedGoal.status,
      category: updatedGoal.category,
      createdAt: updatedGoal.createdAt.toISOString(),
      updatedAt: updatedGoal.updatedAt.toISOString(),
      managerComments: updatedGoal.managerComments,
      employee: updatedGoal.employee,
      manager: updatedGoal.manager
    };

    return NextResponse.json({
      success: true,
      message: 'Goal updated successfully',
      goal: transformedGoal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update goal',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 