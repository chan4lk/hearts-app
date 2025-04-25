import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { score, comments } = body;

    if (!score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Invalid rating score' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
      },
      include: {
        employee: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    if (goal.employee.managerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only rate goals of your direct reports' },
        { status: 403 }
      );
    }

    if (goal.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Goal must be approved before rating' },
        { status: 400 }
      );
    }

    const existingRating = await prisma.rating.findFirst({
      where: {
        goalId: params.goalId,
        managerRatedById: session.user.id,
      },
    });

    let rating;
    if (existingRating) {
      rating = await prisma.rating.update({
        where: {
          id: existingRating.id,
        },
        data: {
          score,
          comments,
          managerRatedById: session.user.id,
        },
        include: {
          managerRatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      rating = await prisma.rating.create({
        data: {
          goalId: params.goalId,
          score,
          comments,
          selfRatedById: goal.employeeId,
          managerRatedById: session.user.id,
        },
        include: {
          managerRatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error submitting manager rating:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit rating',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 