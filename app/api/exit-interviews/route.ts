import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: List exit interviews
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where: any = {};

    // Apply status filter if provided
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Role-based filtering
    if (session.user.role === 'ADMIN') {
      // ADMIN: can see all exit interviews
    } else if (session.user.role === 'MANAGER') {
      // MANAGER: interviews they created
      where.managerId = session.user.id;
    } else {
      // EMPLOYEE: interviews where they are the employee
      where.employeeId = session.user.id;
    }

    const exitInterviews = await prisma.exitInterview.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        },
        manager: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ exitInterviews });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// POST: Create exit interview
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only MANAGER or ADMIN can create exit interviews
    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only managers and admins can create exit interviews' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { employeeId, departureDate, reason } = body;

    // Validate required fields
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    if (!departureDate) {
      return NextResponse.json(
        { error: 'Departure date is required' },
        { status: 400 }
      );
    }

    // Verify the employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, isActive: true }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create exit interview and notification in a transaction
    const exitInterview = await prisma.$transaction(async (tx) => {
      // Create the exit interview with PENDING status
      const interview = await tx.exitInterview.create({
        data: {
          employeeId,
          managerId: session.user.id,
          departureDate: new Date(departureDate),
          reason: reason || null,
          status: 'PENDING'
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

      // Send EXIT_INTERVIEW_CREATED notification to employee
      await tx.notification.create({
        data: {
          type: NotificationType.EXIT_INTERVIEW_CREATED,
          message: `An exit interview has been created for you by ${session.user.name || session.user.email}`,
          userId: employeeId
        }
      });

      return interview;
    });

    logger.log('Exit interview created', 'Information', {
      interviewId: exitInterview.id,
      employeeId,
      managerId: session.user.id
    });

    return NextResponse.json(
      { success: true, message: 'Exit interview created successfully', exitInterview },
      { status: 201 }
    );
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
