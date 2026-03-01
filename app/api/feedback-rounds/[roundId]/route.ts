import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: Get feedback round detail with all reviews
export async function GET(
  req: NextRequest,
  { params }: { params: { roundId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { roundId } = resolvedParams;

    const round = await prisma.feedbackRound.findUnique({
      where: { id: roundId },
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
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Feedback round not found' },
        { status: 404 }
      );
    }

    // Authorization: only round initiator, employee, or ADMIN
    const isInitiator = round.initiatedById === session.user.id;
    const isEmployee = round.employeeId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isInitiator && !isEmployee && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view this feedback round' },
        { status: 403 }
      );
    }

    // Add review summary
    const totalReviews = round.reviews.length;
    const submittedReviews = round.reviews.filter(
      (r) => r.status === 'SUBMITTED'
    ).length;

    return NextResponse.json({
      round: {
        ...round,
        reviewsSummary: {
          total: totalReviews,
          submitted: submittedReviews,
          pending: totalReviews - submittedReviews
        }
      }
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// DELETE: Cancel a feedback round
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roundId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { roundId } = resolvedParams;

    const round = await prisma.feedbackRound.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        status: true,
        initiatedById: true,
        employeeId: true
      }
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Feedback round not found' },
        { status: 404 }
      );
    }

    // Authorization: only initiator or ADMIN
    const isInitiator = round.initiatedById === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isInitiator && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the initiator or an admin can cancel this feedback round' },
        { status: 403 }
      );
    }

    // Cannot cancel an already completed or cancelled round
    if (round.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed feedback round' },
        { status: 400 }
      );
    }

    if (round.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Feedback round is already cancelled' },
        { status: 400 }
      );
    }

    const updatedRound = await prisma.feedbackRound.update({
      where: { id: roundId },
      data: {
        status: 'CANCELLED'
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        },
        initiatedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    logger.log('Feedback round cancelled', 'Information', {
      roundId
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback round cancelled successfully',
      round: updatedRound
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
