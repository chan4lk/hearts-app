import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to format rating response
function formatRatingResponse(rating: any) {
  return {
    id: rating.id,
    goalId: rating.goalId,
    // Self rating
    selfScore: rating.selfScore,
    selfComments: rating.selfComments,
    selfRatedBy: rating.selfRatedBy,
    selfRatedAt: rating.selfRatedAt,
    // Manager rating
    managerScore: rating.managerScore,
    managerComments: rating.managerComments,
    managerRatedBy: rating.managerRatedBy,
    managerRatedAt: rating.managerRatedAt,
    // Meta
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.goalId;

    // Get the rating for the goal (one rating per goal now)
    const rating = await prisma.rating.findUnique({
      where: {
        goalId
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

    if (!rating) {
      return NextResponse.json({ rating: null });
    }

    return NextResponse.json({ rating: formatRatingResponse(rating) });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.goalId;
    const body = await request.json();
    const { score, comments, type = 'self' } = body; // type: 'self' or 'manager'

    if (!score || typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Invalid rating score' },
        { status: 400 }
      );
    }

    // Get the goal to check permissions
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const isEmployee = goal.employeeId === session.user.id;
    const isManager = session.user.role === 'MANAGER' || session.user.role === 'ADMIN';
    const isGoalManager = goal.employee.managerId === session.user.id;

    // Determine rating type and validate permissions
    let updateData: any = {};

    if (type === 'manager' && isManager && (isGoalManager || session.user.role === 'ADMIN')) {
      updateData = {
        managerScore: score,
        managerComments: comments,
        managerRatedById: session.user.id,
        managerRatedAt: new Date(),
      };
    } else if (type === 'self' && isEmployee) {
      updateData = {
        selfScore: score,
        selfComments: comments,
        selfRatedById: session.user.id,
        selfRatedAt: new Date(),
      };
    } else {
      return NextResponse.json(
        { error: 'You do not have permission to submit this rating' },
        { status: 403 }
      );
    }

    // Upsert rating - one rating per goal
    const rating = await prisma.rating.upsert({
      where: { goalId },
      update: updateData,
      create: {
        goalId,
        ...updateData,
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

    return NextResponse.json(formatRatingResponse(rating));
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    return NextResponse.json(
      { error: 'Failed to create/update rating' },
      { status: 500 }
    );
  }
}