import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: List feedback rounds
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where: any = {};

    // Apply status filter if provided
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Role-based filtering
    if (session.user.role === 'ADMIN') {
      // ADMIN: can see all rounds
    } else if (session.user.role === 'MANAGER') {
      // MANAGER: rounds they initiated
      where.initiatedById = session.user.id;
    } else {
      // EMPLOYEE: rounds where they are the employee
      where.employeeId = session.user.id;
    }

    const rounds = await prisma.feedbackRound.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        },
        initiatedBy: {
          select: { id: true, name: true, email: true }
        },
        reviews: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add review count and status summary to each round
    const roundsWithSummary = rounds.map((round) => {
      const totalReviews = round.reviews.length;
      const submittedReviews = round.reviews.filter(
        (r) => r.status === 'SUBMITTED'
      ).length;
      const pendingReviews = totalReviews - submittedReviews;

      return {
        ...round,
        reviewsSummary: {
          total: totalReviews,
          submitted: submittedReviews,
          pending: pendingReviews
        }
      };
    });

    return NextResponse.json({ rounds: roundsWithSummary });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// POST: Create a new feedback round
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only MANAGER or ADMIN can create feedback rounds
    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only managers and admins can create feedback rounds' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { employeeId, type, reviewerIds } = body;

    // Validate required fields
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    if (!type || !['THREE_MONTH', 'ANNUAL'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be THREE_MONTH or ANNUAL' },
        { status: 400 }
      );
    }

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one reviewer is required' },
        { status: 400 }
      );
    }

    // Verify the employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, isActive: true }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { error: 'Employee is not active' },
        { status: 400 }
      );
    }

    // Verify all reviewers exist
    const reviewers = await prisma.user.findMany({
      where: {
        id: { in: reviewerIds },
        isActive: true
      },
      select: { id: true, name: true }
    });

    if (reviewers.length !== reviewerIds.length) {
      return NextResponse.json(
        { error: 'One or more reviewers not found or inactive' },
        { status: 400 }
      );
    }

    // Create the feedback round and review records in a transaction
    const round = await prisma.$transaction(async (tx) => {
      // Create the feedback round
      const feedbackRound = await tx.feedbackRound.create({
        data: {
          type,
          employeeId,
          initiatedById: session.user.id,
          status: 'PENDING'
        }
      });

      // Create feedback review records for each reviewer
      await tx.feedbackReview.createMany({
        data: reviewerIds.map((reviewerId: string) => ({
          feedbackRoundId: feedbackRound.id,
          reviewerId,
          status: 'PENDING'
        }))
      });

      // Create notification for the employee
      await tx.notification.create({
        data: {
          type: NotificationType.FEEDBACK_ROUND_CREATED,
          message: `A ${type === 'THREE_MONTH' ? '3-month' : 'annual'} feedback round has been initiated for you by ${session.user.name || session.user.email}`,
          userId: employeeId
        }
      });

      // Create notifications for each reviewer
      await tx.notification.createMany({
        data: reviewerIds.map((reviewerId: string) => ({
          type: NotificationType.FEEDBACK_REVIEW_REQUESTED,
          message: `You have been requested to provide feedback for ${employee.name} in a ${type === 'THREE_MONTH' ? '3-month' : 'annual'} review`,
          userId: reviewerId
        }))
      });

      // Return the created round with includes
      return tx.feedbackRound.findUnique({
        where: { id: feedbackRound.id },
        include: {
          employee: {
            select: { id: true, name: true, email: true }
          },
          initiatedBy: {
            select: { id: true, name: true, email: true }
          },
          reviews: {
            include: {
              reviewer: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });
    });

    logger.log('Feedback round created', 'Information', {
      roundId: round?.id,
      type,
      reviewerCount: reviewerIds.length
    });

    return NextResponse.json(
      { success: true, message: 'Feedback round created successfully', round },
      { status: 201 }
    );
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
