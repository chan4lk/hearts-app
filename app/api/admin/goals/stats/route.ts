import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import { rateLimiters } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.standard(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const goalWhere = { status: { not: 'DELETED' as const } };

    // Run all queries in parallel — use groupBy instead of loading 10K goals
    const [statusAgg, userCounts, recentActivity] = await Promise.all([
      // 1. Goal stats via DB groupBy (replaces loading 10K goals into memory)
      prisma.goal.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: goalWhere
      }),

      // 2. User counts via groupBy (replaces loading 5K users)
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
        where: { role: { in: ['EMPLOYEE', 'MANAGER'] } }
      }),

      // 3. Recent activity (already limited)
      prisma.goal.findMany({
        where: goalWhere,
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          employee: { select: { name: true, email: true } }
        }
      })
    ]);

    // Build stats from aggregation
    const statusMap: Record<string, number> = {};
    let total = 0;
    for (const row of statusAgg) {
      statusMap[row.status] = row._count._all;
      total += row._count._all;
    }

    const stats = {
      total,
      completed: statusMap['COMPLETED'] || 0,
      pending: statusMap['PENDING'] || 0,
      inProgress: statusMap['APPROVED'] || 0,
      draft: statusMap['DRAFT'] || 0,
      rejected: statusMap['REJECTED'] || 0,
      modified: statusMap['MODIFIED'] || 0
    };

    // Build user stats from aggregation
    const userRoleCounts: Record<string, number> = {};
    for (const row of userCounts) {
      userRoleCounts[row.role] = row._count._all;
    }

    const userStats = {
      totalEmployees: userRoleCounts['EMPLOYEE'] || 0,
      totalManagers: userRoleCounts['MANAGER'] || 0
    };

    return NextResponse.json({
      stats,
      userStats,
      recentActivity: recentActivity.map((goal) => ({
        id: goal.id,
        type: goal.status,
        description: `Goal "${goal.title}" was ${goal.status.toLowerCase()}`,
        timestamp: goal.updatedAt.toISOString(),
        employee: goal.employee
      }))
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
