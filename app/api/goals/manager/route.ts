import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug log

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get all employees managed by this manager
    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
      },
    });
    console.log('Found employees:', employees); // Debug log

    const employeeIds = employees.map(emp => emp.id);
    console.log('Employee IDs:', employeeIds); // Debug log

    // Fetch goals for all managed employees
    const goals = await prisma.goal.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
        status: GoalStatus.APPROVED,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ratings: {
          select: {
            id: true,
            score: true,
            comments: true,
            managerRatedById: true,
          },
          where: {
            managerRatedById: session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Found goals:', goals); // Debug log

    // Transform the data to include ratings
    const goalsWithRatings = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      dueDate: goal.dueDate.toISOString(),
      employee: goal.employee,
      rating: goal.ratings[0] || null,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    }));

    console.log('Transformed goals:', goalsWithRatings); // Debug log
    return NextResponse.json(goalsWithRatings);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch goals',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, dueDate, category = 'PROFESSIONAL' } = body;

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
        status: GoalStatus.APPROVED, // Manager's own goals are auto-approved
        employeeId: session.user.id, // Manager is both employee and manager
        managerId: session.user.id,
        approvedAt: new Date(),
        approvedBy: session.user.id
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

    // Add category to the response for frontend compatibility
    const goalWithCategory = {
      ...goal,
      category
    };

    return NextResponse.json(goalWithCategory);
  } catch (error) {
    console.error('Error creating manager goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
} 