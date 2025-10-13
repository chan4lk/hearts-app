import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = params;

    // Get goal to check authorization
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        employeeId: true,
        managerId: true,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if user has access to this goal
    const hasAccess =
      goal.employeeId === session.user.id ||
      goal.managerId === session.user.id ||
      session.user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get goal activity history
    const goalWithHistory = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!goalWithHistory) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Build activity timeline
    const activities = [];

    // Goal created event
    if (goalWithHistory.createdBy) {
      activities.push({
        id: `created-${goalWithHistory.id}`,
        type: 'created',
        timestamp: goalWithHistory.createdAt,
        user: {
          name: goalWithHistory.createdBy.name,
          role: goalWithHistory.createdBy.role,
        },
        data: {},
      });
    }

    // Progress updates (we'll need to track these separately in a future enhancement)
    // For now, we'll show the last progress update if available
    if (goalWithHistory.lastProgressUpdate) {
      activities.push({
        id: `progress-${goalWithHistory.id}`,
        type: 'progress_update',
        timestamp: goalWithHistory.lastProgressUpdate,
        user: {
          name: goalWithHistory.employee.name,
          role: goalWithHistory.employee.role,
        },
        data: {
          progress: goalWithHistory.progress,
          notes: goalWithHistory.progressNotes,
        },
      });
    }

    // Status changes
    if (goalWithHistory.approvedAt && goalWithHistory.status === 'APPROVED') {
      activities.push({
        id: `approved-${goalWithHistory.id}`,
        type: 'status_change',
        timestamp: goalWithHistory.approvedAt,
        user: {
          name: goalWithHistory.manager?.name || 'Manager',
          role: goalWithHistory.manager?.role || 'MANAGER',
        },
        data: {
          status: 'APPROVED',
          previousStatus: 'PENDING',
        },
      });
    }

    if (goalWithHistory.rejectedAt && goalWithHistory.status === 'REJECTED') {
      activities.push({
        id: `rejected-${goalWithHistory.id}`,
        type: 'status_change',
        timestamp: goalWithHistory.rejectedAt,
        user: {
          name: goalWithHistory.manager?.name || 'Manager',
          role: goalWithHistory.manager?.role || 'MANAGER',
        },
        data: {
          status: 'REJECTED',
          previousStatus: 'PENDING',
          comment: goalWithHistory.managerComments,
        },
      });
    }

    if (goalWithHistory.status === 'COMPLETED') {
      activities.push({
        id: `completed-${goalWithHistory.id}`,
        type: 'completed',
        timestamp: goalWithHistory.updatedAt,
        user: {
          name: goalWithHistory.employee.name,
          role: goalWithHistory.employee.role,
        },
        data: {
          progress: 100,
        },
      });
    }

    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      goalId,
      activities,
    });

  } catch (error) {
    console.error('Error fetching goal activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal activity' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

