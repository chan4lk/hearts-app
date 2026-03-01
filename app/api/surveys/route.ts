export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET - List surveys
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    const userRole = session.user.role;
    const userId = session.user.id;

    let whereClause: any = {};

    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      // Manager/Admin can see all surveys, optionally filtered by employeeId
      if (employeeId) {
        whereClause.employeeId = employeeId;
      }
    } else {
      // Employee sees only their own surveys
      whereClause.employeeId = userId;
    }

    const surveys = await prisma.employeeSurvey.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ surveys });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// POST - Create survey
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'MANAGER' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, type } = body;

    // Validate required fields
    if (!employeeId || !type) {
      return NextResponse.json(
        { error: 'employeeId and type are required' },
        { status: 400 }
      );
    }

    // Validate survey type
    if (type !== 'NEW_JOINER_FEEDBACK') {
      return NextResponse.json(
        { error: 'Invalid survey type. Must be NEW_JOINER_FEEDBACK' },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const survey = await prisma.employeeSurvey.create({
      data: {
        type,
        status: 'PENDING',
        employee: { connect: { id: employeeId } },
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send notification to the employee
    await prisma.notification.create({
      data: {
        type: NotificationType.SURVEY_REQUESTED,
        message: `You have a new survey to complete: ${type.replace(/_/g, ' ').toLowerCase()}`,
        userId: employeeId,
      },
    });

    return NextResponse.json({ survey }, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
