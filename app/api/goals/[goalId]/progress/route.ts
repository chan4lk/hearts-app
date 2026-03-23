import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// Valid statuses for progress updates — employees track progress while working
const ALLOWED_STATUSES_FOR_PROGRESS = ['APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED'];

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

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return new NextResponse('Invalid progress value', { status: 400 });
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
        { error: `Cannot update progress for goals with status: ${goal.status}. Progress can only be updated for APPROVED, IN_PROGRESS, ON_HOLD, or BLOCKED goals.` },
        { status: 400 }
      );
    }

    // Determine the progress status based on progress value if not provided
    let finalProgressStatus = progressStatus;
    if (!finalProgressStatus) {
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
        progress: progress,
        progressStatus: finalProgressStatus,
        progressNotes: notes,
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
          type: NotificationType.GOAL_UPDATED,
          message: `Progress updated to ${progress}% for goal: ${goal.title}`,
          userId: goal.managerId,
          goalId: updatedGoal.id,
        },
      });
    }

    return NextResponse.json(updatedGoal);
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}