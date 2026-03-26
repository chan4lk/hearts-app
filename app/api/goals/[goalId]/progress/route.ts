import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { progressUpdateSchema } from '@/lib/validation';
import { handleApiError, validateUUID } from '@/app/api/utils/error-handler';

// Valid statuses for progress updates — employees track progress while working
const ALLOWED_STATUSES_FOR_PROGRESS = ['APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED'];

// Progress status values are now validated by Zod schema (progressUpdateSchema)

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invalidId = validateUUID(params.goalId, 'goal ID');
    if (invalidId) return invalidId;

    const body = await req.json();
    const parsed = progressUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { progress, notes, progressStatus } = parsed.data;

    // Get the goal to check ownership and status
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      select: { employeeId: true, managerId: true, status: true, title: true },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}