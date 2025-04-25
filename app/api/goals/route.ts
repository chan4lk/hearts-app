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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { manager: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get goals based on user role
    const goals = await prisma.goal.findMany({
      where: user.role === 'ADMIN' ? {} : {
        OR: [
          { employeeId: user.id },
          { managerId: user.id }
        ]
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

    // Transform goals to match frontend expectations
    const transformedGoals = goals.map((goal: GoalWithRelations) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.toISOString(),
      status: goal.status,
      category: goal.category,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      managerComments: goal.managerComments,
      employee: goal.employee,
      manager: goal.manager
    }));

    // Calculate stats
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.status === 'COMPLETED').length;
    const inProgressGoals = goals.filter(goal => goal.status === 'MODIFIED').length;
    const pendingGoals = goals.filter(goal => goal.status === 'PENDING').length;
    const approvedGoals = goals.filter(goal => goal.status === 'APPROVED').length;
    const rejectedGoals = goals.filter(goal => goal.status === 'REJECTED').length;
    const draftGoals = goals.filter(goal => goal.status === 'DRAFT').length;

    // Calculate category stats
    const categoryStats = goals.reduce((acc: Record<string, number>, goal) => {
      const category = goal.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      goals: transformedGoals,
      stats: {
        total: totalGoals,
        completed: completedGoals,
        inProgress: inProgressGoals,
        pending: pendingGoals,
        approved: approvedGoals,
        rejected: rejectedGoals,
        draft: draftGoals,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, employeeId, dueDate, category, status = 'DRAFT' } = body;

    // Validate required fields
    if (!title || !description || !employeeId || !dueDate || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdmin = session.user.role === 'ADMIN';

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        category,
        status,
        employee: {
          connect: { id: employeeId }
        },
        manager: isAdmin ? undefined : {
          connect: { id: session.user.id }
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

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
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
    const { id, status, managerComments } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is authorized to update the goal
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { manager: true }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        status,
        managerComments,
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

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
} 