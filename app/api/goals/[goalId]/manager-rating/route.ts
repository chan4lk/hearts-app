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

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
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

    // Admin can rate any goal, Manager can only rate their direct reports' goals
    if (session.user.role === 'MANAGER' && goal.employee.managerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only rate goals of your direct reports' },
        { status: 403 }
      );
    }

    if (goal.status !== 'APPROVED' && goal.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Goal must be approved or completed before rating' },
        { status: 400 }
      );
    }

    // Upsert rating - one rating per goal
    const rating = await prisma.rating.upsert({
      where: {
        goalId: params.goalId,
      },
      update: {
        managerScore: score,
        managerComments: comments,
        managerRatedById: session.user.id,
        managerRatedAt: new Date(),
      },
      create: {
        goalId: params.goalId,
        managerScore: score,
        managerComments: comments,
        managerRatedById: session.user.id,
        managerRatedAt: new Date(),
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
      selfScore: rating.selfScore,
      selfComments: rating.selfComments,
      selfRatedBy: rating.selfRatedBy,
      selfRatedAt: rating.selfRatedAt,
      score: rating.managerScore,
      comments: rating.managerComments,
      managerRatedBy: rating.managerRatedBy,
      managerRatedAt: rating.managerRatedAt,
      updatedAt: rating.updatedAt,
    });
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