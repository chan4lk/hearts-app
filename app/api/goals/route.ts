export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Goal, GoalStatus, User, Prisma } from '@prisma/client';

type GoalWithRelations = Goal & {
  category: string;
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
};

// Define valid status transitions
type StatusTransitions = {
  [key in GoalStatus]: GoalStatus[];
};

const validTransitions: StatusTransitions = {
  DRAFT: ['PENDING'],
  PENDING: ['APPROVED', 'REJECTED', 'MODIFIED'],
  MODIFIED: ['PENDING'],
  APPROVED: ['COMPLETED'],
  REJECTED: ['DRAFT'],
  COMPLETED: []
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For employees, fetch goals assigned to them by managers
    const goals = await prisma.goal.findMany({
      where: {
        employeeId: session.user.id,
        managerId: { not: session.user.id }, // Exclude self-created goals
        status: { not: 'DELETED' }
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, dueDate, employeeId } = await req.json();

    // Check if user is admin or manager
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    
    if (!isAdminOrManager && !employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required for admin/manager goal creation' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        category,
        dueDate: new Date(dueDate),
        status: isAdminOrManager ? 'DRAFT' : 'PENDING', // Start as DRAFT for admin/manager, PENDING for employees
        employeeId: employeeId || session.user.id,
        managerId: isAdminOrManager ? session.user.id : null,
        createdById: session.user.id,
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

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    // Check if user is authorized to delete the goal
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { 
        manager: true,
        employee: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check authorization
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    const isGoalManager = goal.managerId === session.user.id;
    const isGoalEmployee = goal.employeeId === session.user.id;

    // Only allow deletion if:
    // 1. User is admin/manager and goal is in DRAFT or PENDING state
    // 2. User is the employee and goal is in DRAFT state
    if (
      !isAdminOrManager && 
      !(isGoalEmployee && goal.status === 'DRAFT')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this goal' },
        { status: 403 }
      );
    }

    // Soft delete by updating status to DELETED
    const deletedGoal = await prisma.goal.update({
      where: { id },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
        updatedBy: {
          connect: {
            id: session.user.id
          }
        }
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

    return NextResponse.json(deletedGoal);
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, managerComments, title, description, dueDate, category } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    // Check if user is authorized to update the goal
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { 
        manager: true,
        employee: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check authorization based on role and status
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    const isGoalManager = goal.managerId === session.user.id;
    const isGoalEmployee = goal.employeeId === session.user.id;

    // Prepare update data
    const updateData: Prisma.GoalUpdateInput = {
      updatedAt: new Date(),
      updatedBy: {
        connect: {
          id: session.user.id
        }
      }
    };

    // Handle status update if provided
    if (status) {
      const currentStatus = goal.status as GoalStatus;
      const newStatus = status as GoalStatus;
      
      // Check if the status transition is valid
      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: 'Invalid status transition' },
          { status: 400 }
        );
      }

      // Check if user has permission for this status change
      if (
        (newStatus === 'PENDING' && !isGoalEmployee) ||
        (['APPROVED', 'REJECTED', 'MODIFIED'].includes(newStatus) && !isAdminOrManager) ||
        (newStatus === 'COMPLETED' && !isGoalEmployee) ||
        (newStatus === 'DRAFT' && !isGoalEmployee)
      ) {
        return NextResponse.json({ error: 'Unauthorized status change' }, { status: 403 });
      }

      updateData.status = newStatus;

      // Add manager comments if applicable
      if (['APPROVED', 'REJECTED', 'MODIFIED'].includes(newStatus) && managerComments) {
        updateData.managerComments = managerComments;
      }
    }

    // Handle content updates if provided
    if (title || description || dueDate || category) {
      // Only allow content updates if:
      // 1. User is admin/manager and goal is in DRAFT or PENDING state
      // 2. User is the employee and goal is in DRAFT state
      if (
        !isAdminOrManager && 
        !(isGoalEmployee && goal.status === 'DRAFT')
      ) {
        return NextResponse.json(
          { error: 'Unauthorized to update goal content' },
          { status: 403 }
        );
      }

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (category) updateData.category = category;
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
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

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
} 