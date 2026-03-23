import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus, NotificationType } from '@prisma/client';
import { sanitizeInput } from '@/lib/securityUtils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

export async function PUT(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user?.role !== 'MANAGER' && session.user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { managerComments } = body;

    // Check if goal exists, is in valid status, and manager has authority
    const existingGoal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: { employee: { select: { managerId: true } } }
    });

    if (!existingGoal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    // Managers can only reject goals of their direct reports (admins can reject any)
    if (session.user.role === 'MANAGER') {
      const isGoalManager = existingGoal.managerId === session.user.id;
      const isEmployeeManager = existingGoal.employee?.managerId === session.user.id;
      if (!isGoalManager && !isEmployeeManager) {
        return NextResponse.json({ error: 'You can only reject goals of your direct reports' }, { status: 403 });
      }
    }

    if (existingGoal.status !== 'PENDING' && existingGoal.status !== 'DRAFT') {
      return new NextResponse('Goal must be in PENDING or DRAFT status to reject', { status: 400 });
    }

    const goal = await prisma.goal.update({
      where: {
        id: params.goalId,
      },
      data: {
        status: GoalStatus.REJECTED,
        rejectedAt: new Date(),
        managerComments,
        rejectedBy: session.user.id
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Notify the employee (sanitize to prevent stored XSS)
    await prisma.notification.create({
      data: {
        type: NotificationType.GOAL_REJECTED,
        message: `Your goal "${sanitizeInput(goal.title, 200)}" has been rejected${managerComments ? ': ' + sanitizeInput(managerComments, 300) : ''}`,
        userId: goal.employeeId,
        goalId: goal.id,
      },
    });

    return NextResponse.json({
      id: goal.id,
      employeeName: goal.employee.name,
      employeeEmail: goal.employee.email,
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.toISOString(),
      status: goal.status,
      submittedDate: goal.createdAt.toISOString(),
      feedback: goal.managerComments
    });
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 