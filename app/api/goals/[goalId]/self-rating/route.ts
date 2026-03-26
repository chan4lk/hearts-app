import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError, validateUUID } from '@/app/api/utils/error-handler';
import { ratingSubmitSchema } from '@/lib/validation';
import { rateLimiters } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invalidId = validateUUID(params.goalId, 'goal ID');
    if (invalidId) return invalidId;

    const body = await request.json();
    const parsed = ratingSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { score, comments } = parsed.data;

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

    // Goal must be APPROVED or COMPLETED to be rated
    if (goal.status !== 'APPROVED' && goal.status !== 'COMPLETED' && goal.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Goal must be approved, in progress, or completed to submit a rating' }, { status: 400 });
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