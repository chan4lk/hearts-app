import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
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
    const { score, comments } = body;

    if (!score || score < 1 || score > 5) {
      return new NextResponse('Invalid rating score', { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.id,
      },
      include: {
        User_Goal_employeeIdToUser: true,
      },
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (goal.User_Goal_employeeIdToUser.managerId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (goal.status !== 'APPROVED') {
      return new NextResponse('Goal must be approved before rating', { status: 400 });
    }

    const existingRating = await prisma.rating.findFirst({
      where: {
        goalId: params.id,
      },
    });

    if (existingRating) {
      const updatedRating = await prisma.rating.update({
        where: {
          id: existingRating.id,
        },
        data: {
          score,
          comments,
          managerRatedById: session.user.id,
        },
      });

      return NextResponse.json(updatedRating);
    }

    const newRating = await prisma.rating.create({
      data: {
        goalId: params.id,
        score,
        comments,
        selfRatedById: goal.employeeId,
        managerRatedById: session.user.id,
      },
    });

    return NextResponse.json(newRating);
  } catch (error) {
    console.error('Error submitting manager rating:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 