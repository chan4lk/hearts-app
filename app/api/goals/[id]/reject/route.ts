import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { feedback } = body;

    const goal = await prisma.goal.update({
      where: {
        id: params.id,
      },
      data: {
        status: GoalStatus.REJECTED,
        rejectedAt: new Date(),
        managerComments: feedback
      },
      include: {
        User_Goal_employeeIdToUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      id: goal.id,
      employeeName: goal.User_Goal_employeeIdToUser.name,
      employeeEmail: goal.User_Goal_employeeIdToUser.email,
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.toISOString(),
      status: goal.status,
      submittedDate: goal.createdAt.toISOString(),
      feedback: goal.managerComments
    });
  } catch (error) {
    console.error('Error rejecting goal:', error);
    return NextResponse.json(
      { error: 'Failed to reject goal' },
      { status: 500 }
    );
  }
} 