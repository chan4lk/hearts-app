import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET - Get meeting detail
export async function GET(
  req: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { meetingId } = resolvedParams;

    const meeting = await prisma.meetingMinutes.findUnique({
      where: { id: meetingId },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
        feedbackRound: {
          select: { id: true, type: true, status: true },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Only meeting creator (manager), employee, or ADMIN can view
    const userId = session.user.id;
    const userRole = session.user.role;
    if (
      userRole !== 'ADMIN' &&
      meeting.managerId !== userId &&
      meeting.employeeId !== userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// PUT - Update meeting
export async function PUT(
  req: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { meetingId } = resolvedParams;

    const existingMeeting = await prisma.meetingMinutes.findUnique({
      where: { id: meetingId },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Only creator (manager) or ADMIN can update
    const userId = session.user.id;
    const userRole = session.user.role;
    if (userRole !== 'ADMIN' && existingMeeting.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { notes, actionItems, nextSteps, date } = body;

    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (actionItems !== undefined) updateData.actionItems = actionItems;
    if (nextSteps !== undefined) updateData.nextSteps = nextSteps;
    if (date !== undefined) updateData.date = new Date(date);

    const meeting = await prisma.meetingMinutes.update({
      where: { id: meetingId },
      data: updateData,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ meeting });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// DELETE - Delete meeting
export async function DELETE(
  req: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { meetingId } = resolvedParams;

    const existingMeeting = await prisma.meetingMinutes.findUnique({
      where: { id: meetingId },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Only creator (manager) or ADMIN can delete
    const userId = session.user.id;
    const userRole = session.user.role;
    if (userRole !== 'ADMIN' && existingMeeting.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.meetingMinutes.delete({
      where: { id: meetingId },
    });

    return NextResponse.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
