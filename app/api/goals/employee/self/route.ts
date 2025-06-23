import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { GoalStatus, GoalCategory } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        employeeId: session.user.id,
        managerId: session.user.id, // Self-created goals have the same ID for employee and manager
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
        },
        ratings: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching self-created goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, dueDate } = await request.json();

    if (!title || !description || !category || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    if (!Object.values(GoalCategory).includes(category as GoalCategory)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category as GoalCategory,
        dueDate: new Date(dueDate),
        status: GoalStatus.PENDING,
        employeeId: session.user.id,
        managerId: session.user.id, // Set both employee and manager to the current user
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
        },
        ratings: true
      }
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error creating self goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
} 