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

    // Check if user is admin
    const isAdmin = session.user.role === 'ADMIN';
    
    const goal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
        ...(isAdmin ? {} : { employeeId: session.user.id }), // Admin can view any goal
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

    const body = await req.json();
    const { title, description, category, dueDate, department, priority, employeeId } = body;
    
    console.log('API - Received update data:', body);
    console.log('API - Employee ID received:', employeeId);

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
    const isAdmin = session.user.role === 'ADMIN';
    const isManager = session.user.role === 'MANAGER';
    const isGoalEmployee = existingGoal.employeeId === session.user.id;

    // Allow updates if:
    // 1. User is ADMIN (can update any goal regardless of status)
    // 2. User is the employee and goal is in DRAFT or PENDING state
    if (!isAdmin && (!isGoalEmployee || !(existingGoal.status === 'DRAFT' || existingGoal.status === 'PENDING'))) {
      return NextResponse.json(
        { error: 'You can only edit goals in DRAFT or PENDING status, or you must be an admin' },
        { status: 403 }
      );
    }

    const updateData = {
      title: title.trim(),
      description: description.trim(),
      category,
      department: department || 'ENGINEERING',
      priority: priority || 'MEDIUM',
      dueDate: new Date(dueDate),
      employeeId: employeeId || existingGoal.employeeId, // Allow updating employee assignment
      updatedById: session.user.id
    };
    
    console.log('API - Updating goal with data:', updateData);
    
    const goal = await prisma.goal.update({
      where: { id: params.goalId },
      data: updateData,
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
    const isAdmin = session.user.role === 'ADMIN';
    const isManager = session.user.role === 'MANAGER';
    const isGoalEmployee = existingGoal.employeeId === session.user.id;

    // Allow deletion if:
    // 1. User is ADMIN (can delete any goal regardless of status)
    // 2. User is the employee and goal is in DRAFT or PENDING state
    if (!isAdmin && (!isGoalEmployee || !(existingGoal.status === 'DRAFT' || existingGoal.status === 'PENDING'))) {
      return NextResponse.json(
        { error: 'You can only delete goals in DRAFT or PENDING status, or you must be an admin' },
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
      message: 'Goal deleted successfully',
      goal
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
} 