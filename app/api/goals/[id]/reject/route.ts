import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

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

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.id,
      },
      include: {
        employee: true,
      },
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (goal.employee.managerId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const updatedGoal = await prisma.goal.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'REJECTED',
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error rejecting goal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 