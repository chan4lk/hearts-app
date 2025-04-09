import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, Prisma, GoalStatus } from '@prisma/client';

// Define types for the goal data
type GoalData = {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: Date;
  employeeId: string;
  managerId: string;
  managerComments: string | null;
  createdAt: Date;
  updatedAt: Date;
  userName?: string;
  userEmail?: string;
  managerName?: string;
  managerEmail?: string;
};

export async function GET() {
  try {
    // Fetch all goals that are not in draft status
    const goals = await prisma.goal.findMany({
      where: {
        status: {
          in: [GoalStatus.PENDING, GoalStatus.APPROVED, GoalStatus.REJECTED]
        }
      },
      include: {
        User_Goal_employeeIdToUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const formattedGoals = goals.map(goal => ({
      id: goal.id,
      employeeName: goal.User_Goal_employeeIdToUser.name,
      employeeEmail: goal.User_Goal_employeeIdToUser.email,
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.toISOString(),
      status: goal.status,
      submittedDate: goal.createdAt.toISOString(),
      feedback: goal.managerComments
    }));

    return NextResponse.json(formattedGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Received goal creation request:', body);
    
    const { title, description, dueDate } = body;
    
    if (!title || !description || !dueDate) {
      console.error('Missing required fields:', { title, description, dueDate });
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate date format
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date format:', dueDate);
      return new NextResponse('Invalid date format', { status: 400 });
    }

    // Find the employee's assigned manager
    const employee = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!employee?.managerId) {
      console.error('Employee has no assigned manager');
      return new NextResponse('Employee has no assigned manager', { status: 400 });
    }

    console.log('Found manager:', employee.managerId);
    console.log('Creating goal for user:', session.user.id);

    // Create the goal with type assertion to fix linter errors
    const goalData = {
      title,
      description,
      dueDate: parsedDate,
      status: GoalStatus.PENDING,
      employeeId: session.user.id,
      managerId: employee.managerId
    } as any;

    const goal = await prisma.goal.create({
      data: goalData
    });

    console.log('Goal created successfully:', goal);
    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error in goal creation route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.MANAGER) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, comments } = body;

    // Use type assertion to fix linter errors
    const updateData = {
      status,
      managerComments: comments,
    } as any;

    const goal = await prisma.goal.update({
      where: {
        id: id,
        managerId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 