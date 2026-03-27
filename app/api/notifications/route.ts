import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaginationFromSearchParams, getPaginationMeta, PAGINATION_LIMITS } from '@/lib/pagination';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationFromSearchParams(
      searchParams,
      PAGINATION_LIMITS.NOTIFICATIONS
    );

    // Only show non-archived notifications (archivedAt field added in migration)
    const notifWhere = { userId: session.user.id, ...({ archivedAt: null } as any) };

    // Run count and findMany in parallel
    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where: notifWhere }),
      prisma.notification.findMany({
        where: notifWhere,
        include: {
          goal: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return NextResponse.json({ 
      notifications,
      pagination: getPaginationMeta(page, limit, total)
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// PATCH - Mark notification as read
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id // Ensure user can only update their own notifications
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Archive instead of hard-delete (preserves audit trail)
    // Note: `archivedAt` field added in migration — run `prisma generate` to remove `as any`
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id
      },
      data: {
        ...({ archivedAt: new Date() } as any)
      }
    });

    return NextResponse.json({ success: true, action: 'archived' });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// PUT - Bulk archive old read notifications (admin or user's own)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'archive-read') {
      // Archive all read notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: true,
          ...({ archivedAt: null } as any),
          createdAt: { lt: thirtyDaysAgo }
        },
        data: {
          ...({ archivedAt: new Date() } as any)
        }
      });

      return NextResponse.json({ success: true, archived: result.count });
    }

    if (action === 'mark-all-read') {
      const result = await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
          ...({ archivedAt: null } as any)
        },
        data: { isRead: true }
      });

      return NextResponse.json({ success: true, updated: result.count });
    }

    return NextResponse.json({ error: 'Invalid action. Use: archive-read, mark-all-read' }, { status: 400 });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

