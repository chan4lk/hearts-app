import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus, NotificationType } from '@prisma/client';
import { sanitizeInput } from '@/lib/securityUtils';
import { approveRejectSchema } from '@/lib/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import { rateLimiters } from '@/lib/rateLimit';

export async function PUT(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    // Rate limit approval operations
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'MANAGER' && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = approveRejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { managerComments } = parsed.data;

    // Check if goal exists, is in valid status, and manager has authority
    const existingGoal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      include: { employee: { select: { managerId: true } } }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Managers can only approve goals of their direct reports (admins can approve any)
    if (session.user.role === 'MANAGER') {
      const isGoalManager = existingGoal.managerId === session.user.id;
      const isEmployeeManager = existingGoal.employee?.managerId === session.user.id;
      if (!isGoalManager && !isEmployeeManager) {
        return NextResponse.json({ error: 'You can only approve goals of your direct reports' }, { status: 403 });
      }
    }

    if (existingGoal.status !== 'PENDING' && existingGoal.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Goal must be in PENDING or DRAFT status to approve' }, { status: 400 });
    }

    const goal = await prisma.goal.update({
      where: {
        id: params.goalId,
      },
      data: {
        status: GoalStatus.APPROVED,
        approvedAt: new Date(),
        managerComments,
        approvedBy: session.user.id
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
        type: NotificationType.GOAL_APPROVED,
        message: `Your goal "${sanitizeInput(goal.title, 200)}" has been approved by ${sanitizeInput(session.user.name || 'your manager', 100)}`,
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
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 