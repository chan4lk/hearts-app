import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        employeeId: session.user.id,
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
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.toISOString(),
      status: goal.status,
      submittedDate: goal.createdAt.toISOString(),
      managerComments: goal.managerComments
    }));

    return NextResponse.json(formattedGoals);
  } catch (error) {
    console.error('Error fetching employee goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
} 