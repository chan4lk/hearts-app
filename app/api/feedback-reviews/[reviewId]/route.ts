import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: Get feedback review detail (for the reviewer to view/submit)
export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { reviewId } = resolvedParams;

    const review = await prisma.feedbackReview.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true }
        },
        feedbackRound: {
          select: {
            id: true,
            type: true,
            status: true,
            employee: {
              select: { id: true, name: true, email: true, department: true, position: true }
            }
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Feedback review not found' }, { status: 404 });
    }

    // Only the assigned reviewer, the round initiator, or ADMIN can view
    const isReviewer = review.reviewerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    if (!isReviewer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      id: review.id,
      roundId: review.feedbackRoundId,
      reviewerId: review.reviewerId,
      status: review.status,
      score: review.score,
      comments: review.comments,
      strengths: review.strengths,
      improvements: review.improvements,
      submittedAt: review.submittedAt,
      round: {
        id: review.feedbackRound.id,
        type: review.feedbackRound.type,
        status: review.feedbackRound.status,
        employee: review.feedbackRound.employee
      }
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// PUT: Submit a feedback review
export async function PUT(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { reviewId } = resolvedParams;

    const body = await req.json();
    const { score, comments, strengths, improvements } = body;

    // Validate score
    if (score === undefined || score === null) {
      return NextResponse.json(
        { error: 'Score is required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Score must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate comments
    if (!comments || typeof comments !== 'string') {
      return NextResponse.json(
        { error: 'Comments are required' },
        { status: 400 }
      );
    }

    if (comments.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comments must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Fetch the review with its round info
    const review = await prisma.feedbackReview.findUnique({
      where: { id: reviewId },
      include: {
        feedbackRound: {
          include: {
            employee: {
              select: { id: true, name: true }
            },
            initiatedBy: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Feedback review not found' },
        { status: 404 }
      );
    }

    // Only the assigned reviewer can submit
    if (review.reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the assigned reviewer can submit this feedback' },
        { status: 403 }
      );
    }

    // Cannot submit if already submitted
    if (review.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: 'This feedback review has already been submitted' },
        { status: 400 }
      );
    }

    // Cannot submit if round is cancelled or completed
    if (review.feedbackRound.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot submit feedback for a cancelled round' },
        { status: 400 }
      );
    }

    if (review.feedbackRound.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot submit feedback for a completed round' },
        { status: 400 }
      );
    }

    // Use a transaction to submit the review and potentially complete the round
    const result = await prisma.$transaction(async (tx) => {
      // Update the review
      const updatedReview = await tx.feedbackReview.update({
        where: { id: reviewId },
        data: {
          score,
          comments: comments.trim(),
          strengths: strengths?.trim() || null,
          improvements: improvements?.trim() || null,
          status: 'SUBMITTED',
          submittedAt: new Date()
        },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Update round status to IN_PROGRESS if it was PENDING
      if (review.feedbackRound.status === 'PENDING') {
        await tx.feedbackRound.update({
          where: { id: review.feedbackRoundId },
          data: { status: 'IN_PROGRESS' }
        });
      }

      // Notify the round initiator about the submission
      const reviewerName = session.user.name || session.user.email;
      const employeeName = review.feedbackRound.employee.name;

      await tx.notification.create({
        data: {
          type: NotificationType.FEEDBACK_REVIEW_SUBMITTED,
          message: `${reviewerName} has submitted their feedback review for ${employeeName}`,
          userId: review.feedbackRound.initiatedById
        }
      });

      // Check if ALL reviews for this round are now submitted
      const allReviews = await tx.feedbackReview.findMany({
        where: { feedbackRoundId: review.feedbackRoundId },
        select: { status: true }
      });

      const allSubmitted = allReviews.every((r) => r.status === 'SUBMITTED');

      let roundCompleted = false;

      if (allSubmitted) {
        // Auto-complete the round
        await tx.feedbackRound.update({
          where: { id: review.feedbackRoundId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });

        roundCompleted = true;

        // Notify initiator about round completion
        await tx.notification.create({
          data: {
            type: NotificationType.FEEDBACK_ROUND_COMPLETED,
            message: `All feedback reviews for ${employeeName} have been completed`,
            userId: review.feedbackRound.initiatedById
          }
        });

        // Notify the employee about round completion
        await tx.notification.create({
          data: {
            type: NotificationType.FEEDBACK_ROUND_COMPLETED,
            message: `Your feedback round has been completed. All reviewers have submitted their feedback.`,
            userId: review.feedbackRound.employeeId
          }
        });
      }

      return { updatedReview, roundCompleted };
    });

    logger.log('Feedback review submitted', 'Information', {
      reviewId,
      roundId: review.feedbackRoundId,
      roundCompleted: result.roundCompleted
    });

    return NextResponse.json({
      success: true,
      message: result.roundCompleted
        ? 'Feedback submitted. All reviews are now complete and the round has been finalized.'
        : 'Feedback submitted successfully',
      review: result.updatedReview,
      roundCompleted: result.roundCompleted
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
