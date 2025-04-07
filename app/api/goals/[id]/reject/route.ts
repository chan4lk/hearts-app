import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { GoalStatus } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user?.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { managerComments } = body;

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.id,
      },
      include: {
        User_Goal_employeeIdToUser: true,
      } as any,
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (goal.managerId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Use type assertion to fix linter errors
    const updateData = {
      status: GoalStatus.REJECTED,
      managerComments,
      rejectedAt: new Date(),
      rejectedBy: session.user.id
    } as any;

    const updatedGoal = await prisma.goal.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error rejecting goal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 