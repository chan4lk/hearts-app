import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// Employee-owned execution status. This is deliberately separate from the
// approval workflow in `status` (GoalStatus) - updating progress here never
// changes whether a goal is DRAFT/APPROVED/REJECTED.
const VALID_PROGRESS_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'];

// Progress can be self-reported regardless of where approval sits.
const ALLOWED_STATUSES_FOR_PROGRESS = ['DRAFT', 'PENDING', 'APPROVED', 'MODIFIED'];

const PROGRESS_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed'
};

// Progress percentages implied by a status change, so the bar stays in step
// with the badge when the employee only picks a status.
const IMPLIED_PROGRESS: Record<string, number> = {
  NOT_STARTED: 0,
  COMPLETED: 100
};

export async function PATCH(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { progressStatus, notes } = await req.json();

    if (!progressStatus) {
      return NextResponse.json({ error: 'Progress status is required' }, { status: 400 });
    }

    if (!VALID_PROGRESS_STATUSES.includes(progressStatus)) {
      return NextResponse.json({ error: 'Invalid progress status value' }, { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Only the goal owner self-reports execution status. Managers and admins
    // read it; they do not write it.
    if (goal.employeeId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the goal owner can update progress status' },
        { status: 403 }
      );
    }

    if (goal.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot update progress for a deleted goal' },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES_FOR_PROGRESS.includes(goal.status)) {
      return NextResponse.json(
        { error: `Cannot update progress for goals with status: ${goal.status}` },
        { status: 400 }
      );
    }

    const impliedProgress = IMPLIED_PROGRESS[progressStatus];

    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        progressStatus: progressStatus as any,
        // ON_HOLD / BLOCKED / IN_PROGRESS leave the percentage untouched -
        // pausing work does not change how much of it is done.
        ...(impliedProgress !== undefined ? { progress: impliedProgress } : {}),
        ...(notes !== undefined ? { progressNotes: notes } : {}),
        lastProgressUpdate: new Date(),
        updatedAt: new Date(),
        updatedById: session.user.id
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        rating: {
          select: {
            id: true,
            selfScore: true,
            selfComments: true,
            selfRatedById: true,
            selfRatedAt: true,
            managerScore: true,
            managerComments: true,
            managerRatedById: true,
            managerRatedAt: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    // Surface the change to the manager - this is the whole point of the field.
    if (goal.managerId) {
      const label = PROGRESS_STATUS_LABELS[progressStatus] || progressStatus;
      const employeeName = goal.employee?.name || 'Employee';

      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_UPDATED,
          message: progressStatus === 'BLOCKED'
            ? `${employeeName} marked goal "${goal.title}" as Blocked`
            : `${employeeName} set goal "${goal.title}" to ${label}`,
          userId: goal.managerId,
          goalId: goal.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
