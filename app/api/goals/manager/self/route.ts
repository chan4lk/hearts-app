import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { GoalStatus } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        managerId: session.user.id,
        employeeId: session.user.id, // Self-goals where manager is also the employee
      },
      include: {
        ratings: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching manager self goals:', error);
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

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, dueDate } = body;

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        status: GoalStatus.PENDING,
        managerId: session.user.id,
        employeeId: session.user.id, // Self-goal where manager is also the employee
      },
      include: {
        ratings: true,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating manager self goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
} 