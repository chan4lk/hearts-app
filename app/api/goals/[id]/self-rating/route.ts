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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { score, comments } = await request.json();

    if (!score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Score must be between 1 and 5' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if the user is either the employee or the manager of this goal
    if (goal.employeeId !== session.user.id && goal.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingRating = await prisma.rating.findFirst({
      where: {
        goalId: params.id,
        selfRatedById: session.user.id,
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
        },
      });

      return NextResponse.json(updatedRating);
    }

    const newRating = await prisma.rating.create({
      data: {
        goalId: params.id,
        score,
        comments,
        selfRatedById: session.user.id,
      },
    });

    return NextResponse.json(newRating);
  } catch (error) {
    console.error('Error submitting self rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 