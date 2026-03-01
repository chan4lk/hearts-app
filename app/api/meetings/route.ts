export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET - List meeting minutes
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

    if (userRole === 'ADMIN') {
      // Admin can see all meetings, optionally filtered by employeeId
      if (employeeId) {
        whereClause.employeeId = employeeId;
      }
    } else if (userRole === 'MANAGER') {
      // Manager sees meetings they created, optionally filtered by employeeId
      if (employeeId) {
        whereClause.managerId = userId;
        whereClause.employeeId = employeeId;
      } else {
        whereClause.managerId = userId;
      }
    } else {
      // Employee sees meetings where they are the employee
      whereClause.employeeId = userId;
    }

    const meetings = await prisma.meetingMinutes.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// POST - Create meeting minutes
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
    const { employeeId, type, date, notes, actionItems, nextSteps, feedbackRoundId } = body;

    // Validate required fields
    if (!employeeId || !type || !date || !notes) {
      return NextResponse.json(
        { error: 'employeeId, type, date, and notes are required' },
        { status: 400 }
      );
    }

    // Validate meeting type
    const validTypes = ['THREE_MONTH_REVIEW', 'SIX_MONTH_REVIEW', 'ANNUAL_REVIEW', 'FEEDBACK_DISCUSSION', 'GENERAL'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid meeting type. Must be one of: ${validTypes.join(', ')}` },
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

    // Build create data
    const createData: any = {
      type,
      date: new Date(date),
      notes,
      actionItems: actionItems || null,
      nextSteps: nextSteps || null,
      employee: { connect: { id: employeeId } },
      manager: { connect: { id: session.user.id } },
    };

    if (feedbackRoundId) {
      createData.feedbackRound = { connect: { id: feedbackRoundId } };
    }

    const meeting = await prisma.meetingMinutes.create({
      data: createData,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send notification to the employee
    await prisma.notification.create({
      data: {
        type: NotificationType.MEETING_MINUTES_CREATED,
        message: `Meeting minutes for "${type.replace(/_/g, ' ').toLowerCase()}" have been created by ${session.user.name || 'your manager'}`,
        userId: employeeId,
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
