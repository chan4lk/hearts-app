import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: Get reviews for a specific feedback round
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

    // First fetch the round to check authorization
    const round = await prisma.feedbackRound.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        initiatedById: true,
        employeeId: true,
        status: true,
        type: true
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
        { error: 'You do not have permission to view reviews for this feedback round' },
        { status: 403 }
      );
    }

    const reviews = await prisma.feedbackReview.findMany({
      where: { feedbackRoundId: roundId },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
