import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// Valid statuses for progress updates
const ALLOWED_STATUSES_FOR_PROGRESS = ['DRAFT', 'PENDING', 'APPROVED', 'MODIFIED'];

// Valid progress status values
const VALID_PROGRESS_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'];

export async function PUT(
  req: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { progress, notes, progressStatus } = body;

    // `progress` is optional so a status-only change (e.g. BLOCKED) does not
    // force the employee to also supply a percentage.
    const hasProgress = progress !== undefined && progress !== null;

    if (hasProgress && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
      return new NextResponse('Invalid progress value', { status: 400 });
    }

    if (!hasProgress && !progressStatus) {
      return new NextResponse('Either progress or progressStatus is required', { status: 400 });
    }

    // Validate progressStatus if provided
    if (progressStatus && !VALID_PROGRESS_STATUSES.includes(progressStatus)) {
      return new NextResponse('Invalid progress status value', { status: 400 });
    }

    // Get the goal to check ownership and status
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      select: { employeeId: true, managerId: true, status: true, title: true },
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (goal.employeeId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if goal status allows progress updates
    if (!ALLOWED_STATUSES_FOR_PROGRESS.includes(goal.status)) {
      return NextResponse.json(
        { error: `Cannot update progress for goals with status: ${goal.status}. Progress can only be updated for DRAFT, PENDING, or APPROVED goals.` },
        { status: 400 }
      );
    }

    // Derive status from the percentage only when the caller did not pick one -
    // an explicit choice (e.g. BLOCKED at 60%) must never be overwritten.
    let finalProgressStatus = progressStatus;
    if (!finalProgressStatus && hasProgress) {
      if (progress === 0) {
        finalProgressStatus = 'NOT_STARTED';
      } else if (progress === 100) {
        finalProgressStatus = 'COMPLETED';
      } else {
        finalProgressStatus = 'IN_PROGRESS';
      }
    }

    // Update the goal progress
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        ...(hasProgress ? { progress } : {}),
        progressStatus: finalProgressStatus,
        ...(notes !== undefined ? { progressNotes: notes } : {}),
        lastProgressUpdate: new Date(),
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        },
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create notification for manager
    if (goal.managerId) {
      await prisma.notification.create({
        data: {
          type: 'GOAL_UPDATED',
          message: hasProgress
            ? `Progress updated to ${progress}% for goal: ${goal.title}`
            : `Progress status set to ${String(finalProgressStatus).replace('_', ' ')} for goal: ${goal.title}`,
          userId: goal.managerId,
          goalId: updatedGoal.id,
        },
      });
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}