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
        id: params.goalId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Only the employee of this goal can submit self-rating
    if (goal.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'Only the goal owner can submit self-rating' }, { status: 403 });
    }

    // Upsert rating - one rating per goal
    const rating = await prisma.rating.upsert({
      where: {
        goalId: params.goalId,
      },
      update: {
        selfScore: score,
        selfComments: comments,
        selfRatedById: session.user.id,
        selfRatedAt: new Date(),
      },
      create: {
        goalId: params.goalId,
        selfScore: score,
        selfComments: comments,
        selfRatedById: session.user.id,
        selfRatedAt: new Date(),
      },
      include: {
        selfRatedBy: {
          select: { id: true, name: true, email: true }
        },
        managerRatedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      id: rating.id,
      goalId: rating.goalId,
      score: rating.selfScore,
      comments: rating.selfComments,
      selfRatedBy: rating.selfRatedBy,
      selfRatedAt: rating.selfRatedAt,
      managerScore: rating.managerScore,
      managerComments: rating.managerComments,
      managerRatedBy: rating.managerRatedBy,
      managerRatedAt: rating.managerRatedAt,
      updatedAt: rating.updatedAt,
    });
  } catch (error) {
    console.error('Error submitting self rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}