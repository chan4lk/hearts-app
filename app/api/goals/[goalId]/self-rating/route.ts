import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

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

    // Allow score to be 0 to clear the rating, or between 1-5 for valid ratings
    if (score !== null && score !== undefined && score !== 0 && (score < 1 || score > 5)) {
      return NextResponse.json(
        { error: 'Score must be between 1 and 5, or 0 to clear rating' },
        { status: 400 }
      );
    }

    // Require justification comments when submitting a rating (score > 0)
    if (score > 0 && (!comments || typeof comments !== 'string' || comments.trim().length < 10)) {
      return NextResponse.json(
        { error: 'Rating justification is required (minimum 10 characters)' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.findUnique({
      where: {
        id: params.goalId,
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true, managerId: true }
        }
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Only the employee of this goal can submit self-rating
    if (goal.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'Only the goal owner can submit self-rating' }, { status: 403 });
    }

    // Check if rating exists
    const existingRating = await prisma.rating.findUnique({
      where: { goalId: params.goalId }
    });

    // If score is 0 or null, clear the self-rating
    if (score === 0 || score === null || score === undefined) {
      if (existingRating) {
        // Check if there's a manager rating - if so, keep the rating record but clear self-rating fields
        if (existingRating.managerScore !== null && existingRating.managerScore !== undefined) {
          // Keep rating record, just clear self-rating
          const rating = await prisma.rating.update({
            where: { goalId: params.goalId },
            data: {
              selfScore: null,
              selfComments: null,
              selfRatedById: null,
              selfRatedAt: null,
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
            score: rating.managerScore || null,
            comments: rating.selfComments,
            selfRatedBy: rating.selfRatedBy,
            selfRatedAt: rating.selfRatedAt,
            managerScore: rating.managerScore,
            managerComments: rating.managerComments,
            managerRatedBy: rating.managerRatedBy,
            managerRatedAt: rating.managerRatedAt,
            updatedAt: rating.updatedAt,
          });
        } else {
          // No manager rating, delete the entire rating record
          await prisma.rating.delete({
            where: { goalId: params.goalId }
          });

          return NextResponse.json({
            id: null,
            goalId: params.goalId,
            selfScore: null,
            score: null,
            comments: null,
            selfRatedBy: null,
            selfRatedAt: null,
            managerScore: null,
            managerComments: null,
            managerRatedBy: null,
            managerRatedAt: null,
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // No rating exists, return null response
        return NextResponse.json({
          id: null,
          goalId: params.goalId,
          selfScore: null,
          score: null,
          comments: null,
          selfRatedBy: null,
          selfRatedAt: null,
          managerScore: null,
          managerComments: null,
          managerRatedBy: null,
          managerRatedAt: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Upsert rating - one rating per goal
    const rating = await prisma.rating.upsert({
      where: {
        goalId: params.goalId,
      },
      update: {
        selfScore: score,
        selfComments: comments || null,
        selfRatedById: session.user.id,
        selfRatedAt: new Date(),
      },
      create: {
        goalId: params.goalId,
        selfScore: score,
        selfComments: comments || null,
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

    // Create notification for manager when employee submits self-rating (only for valid ratings)
    if (goal.employee?.managerId && score > 0) {
      await prisma.notification.create({
        data: {
          type: NotificationType.RATING_RECEIVED,
          message: `${goal.employee.name || 'Employee'} submitted a self-rating (${score} stars) for goal "${goal.title}"`,
          userId: goal.employee.managerId,
          goalId: goal.id,
        },
      });
    }

    return NextResponse.json({
      id: rating.id,
      goalId: rating.goalId,
      selfScore: rating.selfScore,
      score: rating.selfScore || rating.managerScore || null,
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
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}