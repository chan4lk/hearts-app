import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NotificationType } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> | { goalId: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const goalId = resolvedParams.goalId;

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { score, comments } = body;

    // Handle score = 0 to remove rating
    if (score === 0) {
      const existingRating = await prisma.rating.findUnique({
        where: { goalId: goalId }
      });

      if (existingRating) {
        // If rating exists, remove manager rating but preserve self-rating
        await prisma.rating.update({
          where: { goalId: goalId },
          data: {
            managerScore: null,
            managerComments: null,
            managerRatedById: null,
            managerRatedAt: null,
            // Preserve self-rating fields
          }
        });

        // Fetch updated rating
        const rating = await prisma.rating.findUnique({
          where: { goalId: goalId },
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
          id: rating?.id || '',
          goalId: goalId,
          selfScore: rating?.selfScore,
          selfComments: rating?.selfComments,
          selfRatedBy: rating?.selfRatedBy,
          selfRatedAt: rating?.selfRatedAt,
          score: rating?.managerScore || null,
          comments: rating?.managerComments,
          managerRatedBy: rating?.managerRatedBy,
          managerRatedAt: rating?.managerRatedAt,
          updatedAt: rating?.updatedAt,
        });
      } else {
        // No rating exists, nothing to remove
        return NextResponse.json({
          id: '',
          goalId: goalId,
          selfScore: null,
          selfComments: null,
          selfRatedBy: null,
          selfRatedAt: null,
          score: null,
          comments: null,
          managerRatedBy: null,
          managerRatedAt: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (!score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Invalid rating score. Must be between 1 and 5, or 0 to remove rating' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: goalId,
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

    // Check if rating exists first
    const existingRating = await prisma.rating.findUnique({
      where: { goalId: goalId }
    });

    if (existingRating) {
      // Update existing rating - preserve self-rating fields
      await prisma.rating.update({
        where: { goalId: goalId },
        data: {
          managerScore: score,
          managerComments: comments || null,
          managerRatedById: session.user.id,
          managerRatedAt: new Date(),
          // Self-rating fields are automatically preserved
        }
      });
    } else {
      // Create new rating - only manager fields, do not include relations in create
      await prisma.rating.create({
        data: {
          goalId: goalId,
          managerScore: score,
          managerComments: comments || null,
          managerRatedById: session.user.id,
          managerRatedAt: new Date(),
          // Do not set self-rating fields - they will be null by default
        }
      });
    }

    // Fetch the rating with relations after creation/update
    const rating = await prisma.rating.findUnique({
      where: { goalId: goalId },
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
      return NextResponse.json(
        { error: 'Failed to create or retrieve rating' },
        { status: 500 }
      );
    }

    // Create notification for employee when manager rates their goal
    const managerName = session.user.name || session.user.email || 'your manager';
    await prisma.notification.create({
      data: {
        type: NotificationType.RATING_RECEIVED,
        message: `${managerName} rated your goal "${goal.title}" with ${score} star${score > 1 ? 's' : ''}`,
        userId: goal.employeeId,
        goalId: goal.id,
      },
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = error instanceof Error && errorMessage.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      {
        error: 'Failed to submit rating',
        message: errorMessage
      },
      { status: statusCode }
    );
  }
}