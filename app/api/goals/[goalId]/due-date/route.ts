import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError, validateUUID } from '@/app/api/utils/error-handler';
import { rateLimiters } from '@/lib/rateLimit';

// Due date update endpoint for goals
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> | { goalId: string } }
) {
  try {
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;

    const invalidId = validateUUID(resolvedParams.goalId, 'goal ID');
    if (invalidId) return invalidId;
    const { dueDate } = await req.json();
    
    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
    }

    // Get the goal with employee's managerId in a single query (eliminates N+1)
    const goal = await prisma.goal.findUnique({
      where: { id: resolvedParams.goalId },
      include: {
        employee: { select: { id: true, name: true, email: true, managerId: true } },
        manager: { select: { id: true, name: true, email: true } }
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const isEmployee = goal.employeeId === session.user.id;
    const isManagerOrAdmin = session.user.role === 'MANAGER' || session.user.role === 'ADMIN';
    const isGoalManager = goal.managerId === session.user.id;

    // Use employee.managerId from the already-loaded relation (no extra query)
    const isEmployeeManager = isManagerOrAdmin && goal.employee?.managerId === session.user.id;

    // Employees can update due date of their own goals
    // Admins can update ANY goal due date (full permissions)
    // Managers can update due date of goals they manage
    if (!isEmployee && session.user.role !== 'ADMIN' && !(isManagerOrAdmin && (isGoalManager || isEmployeeManager))) {
      return NextResponse.json(
        { error: 'You do not have permission to update this goal due date' },
        { status: 403 }
      );
    }

    // Update the goal due date
    const updatedGoal = await prisma.goal.update({
      where: { id: resolvedParams.goalId },
      data: {
        dueDate: new Date(dueDate),
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

    // Create notification based on who updated
    const updaterName = session.user.name || session.user.email || 'User';
    const formattedDate = new Date(dueDate).toLocaleDateString();
    
    if (isEmployee) {
      // Notify manager when employee updates due date
      if (goal.managerId) {
        await prisma.notification.create({
          data: {
            type: NotificationType.GOAL_UPDATED,
            message: `${goal.employee?.name || 'Employee'} updated due date of goal "${goal.title}" to ${formattedDate}`,
            userId: goal.managerId,
            goalId: goal.id,
          },
        });
      }
    } else {
      // Notify employee when manager/admin updates due date
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_UPDATED,
          message: `Due date of goal "${goal.title}" has been updated to ${formattedDate} by ${updaterName}`,
          userId: goal.employeeId,
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
