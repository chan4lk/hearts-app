import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: Get eligible reviewers for an employee
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only MANAGER or ADMIN can fetch eligible reviewers
    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only managers and admins can view eligible reviewers' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId query parameter is required' },
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

    // Get all active users except the employee themselves
    const reviewers = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: employeeId }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ reviewers });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
