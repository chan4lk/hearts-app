import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user?.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { managerComments } = await request.json();
    const { goalId } = params;

    // Verify the goal belongs to an employee managed by this manager
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        User_Goal_employeeIdToUser: {
          managerId: session.user.id,
        },
      },
    });

    if (!goal) {
      return new NextResponse('Goal not found or access denied', { status: 404 });
    }

    // Update the goal status to REJECTED
    const updatedGoal = await prisma.goal.update({
      where: {
        id: goalId,
      },
      data: {
        status: 'REJECTED',
        managerComments,
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error rejecting goal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 