import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user?.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { managerComments } = body;

    const goal = await prisma.goal.update({
      where: {
        id: params.id,
      },
      data: {
        status: GoalStatus.APPROVED,
        approvedAt: new Date(),
        managerComments,
        approvedBy: session.user.id
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      id: goal.id,
      employeeName: goal.employee.name,
      employeeEmail: goal.employee.email,
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.toISOString(),
      status: goal.status,
      submittedDate: goal.createdAt.toISOString(),
      feedback: goal.managerComments
    });
  } catch (error) {
    console.error('Error approving goal:', error);
    return NextResponse.json(
      { 
        error: 'Failed to approve goal',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 