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
  { params }: { params: Promise<{ goalId: string }> | { goalId: string } }
) {
  try {
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) return rateLimitResponse;

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

    const invalidId = validateUUID(goalId, 'goal ID');
    if (invalidId) return invalidId;

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ratingSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { score, comments } = parsed.data;

    // Handle score = 0 to remove rating
    if (score === 0) {
      const existingRating = await prisma.rating.findUnique({
        where: { goalId: goalId }
      });

      if (existingRating) {
        // If self-rating exists, keep record but clear manager fields
        if (existingRating.selfScore !== null && existingRating.selfScore !== undefined) {
          const rating = await prisma.rating.update({
            where: { goalId: goalId },
            data: {
              managerScore: null,
              managerComments: null,
              managerRatedById: null,
              managerRatedAt: null,
            },
            include: {
              selfRatedBy: { select: { id: true, name: true, email: true } },
              managerRatedBy: { select: { id: true, name: true, email: true } }
            }
          });

          return NextResponse.json({
            id: rating.id,
            goalId: goalId,
            selfScore: rating.selfScore,
            selfComments: rating.selfComments,
            selfRatedBy: rating.selfRatedBy,
            selfRatedAt: rating.selfRatedAt,
            score: null,
            comments: null,
            managerRatedBy: null,
            managerRatedAt: null,
            updatedAt: rating.updatedAt,
          });
        } else {
          // No self-rating either — delete the entire record (consistent with self-rating behavior)
          await prisma.rating.delete({ where: { goalId: goalId } });

          return NextResponse.json({
            id: null,
            goalId: goalId,
            selfScore: null, selfComments: null, selfRatedBy: null, selfRatedAt: null,
            score: null, comments: null, managerRatedBy: null, managerRatedAt: null,
            updatedAt: new Date().toISOString(),
          });
        }
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

    if (goal.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Goal must be completed before manager rating. The employee needs to complete the goal first.' },
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
      logger.error(new Error(`Rating creation/retrieval failed for goalId=${goalId}, managerId=${session.user.id}`));
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
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}