export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import { rateLimiters } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.standard(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run ALL queries in parallel instead of 8 sequential queries
    const [
      roleDistribution,
      totalGoals,
      activeSessions,
      securityAlerts,
      recentUsers
    ] = await Promise.all([
      // 1. Role counts in a single groupBy (replaces 4 separate count queries)
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true }
      }),

      // 2. Total non-deleted goals
      prisma.goal.count({
        where: { status: { not: 'DELETED' } }
      }),

      // 3. Active sessions (last 30 min)
      prisma.user.count({
        where: { updatedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } }
      }),

      // 4. Security alerts (inactive 24h+)
      prisma.user.count({
        where: { updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      }),

      // 5. Recent users
      prisma.user.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { name: true, email: true, role: true, updatedAt: true }
      })
    ]);

    // Derive counts from single groupBy result
    const roleCounts: Record<string, number> = {};
    let totalUsers = 0;
    for (const row of roleDistribution) {
      roleCounts[row.role] = row._count._all;
      totalUsers += row._count._all;
    }

    return NextResponse.json({
      totalUsers,
      employeeCount: roleCounts['EMPLOYEE'] || 0,
      adminCount: roleCounts['ADMIN'] || 0,
      managerCount: roleCounts['MANAGER'] || 0,
      totalGoals,
      activeSessions,
      systemUptime: 99.9,
      securityAlerts,
      roleDistribution,
      recentUsers
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
