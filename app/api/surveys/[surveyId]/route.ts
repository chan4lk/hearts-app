import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET - Get survey detail
export async function GET(
  req: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { surveyId } = resolvedParams;

    const survey = await prisma.employeeSurvey.findUnique({
      where: { id: surveyId },
      include: {
        employee: {
          select: { id: true, name: true, email: true, managerId: true },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Only the survey employee, their manager, or ADMIN can view
    const userId = session.user.id;
    const userRole = session.user.role;
    if (
      userRole !== 'ADMIN' &&
      survey.employeeId !== userId &&
      survey.employee.managerId !== userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ survey });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// PUT - Submit survey responses
export async function PUT(
  req: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { surveyId } = resolvedParams;

    const existingSurvey = await prisma.employeeSurvey.findUnique({
      where: { id: surveyId },
      include: {
        employee: {
          select: { id: true, name: true, managerId: true },
        },
      },
    });

    if (!existingSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Only the survey employee can submit
    if (existingSurvey.employeeId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the assigned employee can submit this survey' },
        { status: 403 }
      );
    }

    // Check survey is still pending
    if (existingSurvey.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Survey has already been submitted' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { responses } = body;

    // Validate responses - accepts array of {question, answer} objects
    if (!responses || !Array.isArray(responses) || responses.length < 5) {
      return NextResponse.json(
        { error: 'All 5 survey responses are required' },
        { status: 400 }
      );
    }

    const allAnswered = responses.every(
      (r: { question?: string; answer?: string }) => r.question && r.answer && r.answer.trim()
    );
    if (!allAnswered) {
      return NextResponse.json(
        { error: 'All survey questions must have answers' },
        { status: 400 }
      );
    }

    const survey = await prisma.employeeSurvey.update({
      where: { id: surveyId },
      data: {
        responses,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send notification to the employee's manager
    if (existingSurvey.employee.managerId) {
      await prisma.notification.create({
        data: {
          type: NotificationType.SURVEY_SUBMITTED,
          message: `${existingSurvey.employee.name || 'An employee'} has submitted their survey`,
          userId: existingSurvey.employee.managerId,
        },
      });
    }

    return NextResponse.json({ survey });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
