import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: Get exit interview detail
export async function GET(
  req: NextRequest,
  { params }: { params: { interviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { interviewId } = resolvedParams;

    const exitInterview = await prisma.exitInterview.findUnique({
      where: { id: interviewId },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true, position: true }
        },
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!exitInterview) {
      return NextResponse.json(
        { error: 'Exit interview not found' },
        { status: 404 }
      );
    }

    // Authorization: only the interview creator (manager), the employee, or ADMIN
    const isCreator = exitInterview.managerId === session.user.id;
    const isEmployee = exitInterview.employeeId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCreator && !isEmployee && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view this exit interview' },
        { status: 403 }
      );
    }

    return NextResponse.json({ interview: { ...exitInterview, managerNotes: exitInterview.notes } });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// PUT: Update/complete exit interview
export async function PUT(
  req: NextRequest,
  { params }: { params: { interviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { interviewId } = resolvedParams;

    // Find the existing exit interview
    const existingInterview = await prisma.exitInterview.findUnique({
      where: { id: interviewId },
      include: {
        employee: {
          select: { id: true, name: true }
        }
      }
    });

    if (!existingInterview) {
      return NextResponse.json(
        { error: 'Exit interview not found' },
        { status: 404 }
      );
    }

    // Authorization: only the creator (manager) or ADMIN can update
    const isCreator = existingInterview.managerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the interview creator or an admin can update this exit interview' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { responses, notes, managerNotes, status } = body;

    // Validate status if provided
    const validStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (responses !== undefined) {
      updateData.responses = responses;
    }

    if (notes !== undefined || managerNotes !== undefined) {
      updateData.notes = notes ?? managerNotes;
    }

    if (status) {
      updateData.status = status;

      // If status set to COMPLETED, set conductedAt to now
      if (status === 'COMPLETED') {
        updateData.conductedAt = new Date();
      }
    }

    // Perform update and send notification in a transaction
    const updatedInterview = await prisma.$transaction(async (tx) => {
      const interview = await tx.exitInterview.update({
        where: { id: interviewId },
        data: updateData,
        include: {
          employee: {
            select: { id: true, name: true, email: true, department: true, position: true }
          },
          manager: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Send EXIT_INTERVIEW_COMPLETED notification to employee if completed
      if (status === 'COMPLETED') {
        await tx.notification.create({
          data: {
            type: NotificationType.EXIT_INTERVIEW_COMPLETED,
            message: `Your exit interview has been completed by ${session.user.name || session.user.email}`,
            userId: existingInterview.employeeId
          }
        });
      }

      return interview;
    });

    logger.log('Exit interview updated', 'Information', {
      interviewId,
      status: status || 'unchanged',
      updatedBy: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: status === 'COMPLETED'
        ? 'Exit interview completed successfully'
        : 'Exit interview updated successfully',
      interview: { ...updatedInterview, managerNotes: (updatedInterview as any).notes }
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
