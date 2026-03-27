export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.standard(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const context = searchParams.get('context');
    const userRole = session.user.role;
    const userId = session.user.id;

    if (process.env.NODE_ENV === 'development') {
      logger.log('Analytics API request', 'Information', { role: userRole, context });
    }

    // Build date range filter
    const dateFilter: Record<string, Date> = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Build where clause based on role and context
    const goalWhereClause: Record<string, unknown> = {
      status: { not: 'DELETED' },
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    };

    const userWhereClause: Record<string, unknown> = { isActive: true };

    const effectiveContext = (userRole === 'ADMIN' && context) ? context : userRole.toLowerCase();

    // Resolve managed employee IDs once (reused in multiple queries)
    let managedEmployeeIds: string[] = [];

    if (effectiveContext === 'employee' || userRole === 'EMPLOYEE') {
      goalWhereClause.employeeId = userId;
      userWhereClause.id = userId;
    } else if (effectiveContext === 'manager' || userRole === 'MANAGER') {
      const managedEmployees = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true },
        distinct: ['id']
      });
      managedEmployeeIds = managedEmployees.map(e => e.id);

      if (managedEmployeeIds.length === 0) {
        // No managed employees — return empty results immediately (no extra queries)
        return NextResponse.json({
          success: true,
          summary: emptySummary(),
          breakdowns: emptyBreakdowns(),
          trends: { monthly: {} },
          employeePerformance: [],
          meta: { role: userRole, dateRange: { start: startDate, end: endDate }, filters: { employeeId: null, department: null } }
        });
      }

      if (employeeId && employeeId !== 'all') {
        if (managedEmployeeIds.includes(employeeId)) {
          goalWhereClause.employeeId = employeeId;
        } else {
          // Not a managed employee — empty
          return NextResponse.json({
            success: true,
            summary: emptySummary(),
            breakdowns: emptyBreakdowns(),
            trends: { monthly: {} },
            employeePerformance: [],
            meta: { role: userRole, dateRange: { start: startDate, end: endDate }, filters: { employeeId, department: null } }
          });
        }
      } else {
        goalWhereClause.employeeId = { in: managedEmployeeIds };
      }
      userWhereClause.managerId = userId;
    }

    // Admin employee filter
    if (employeeId && employeeId !== 'all' && userRole === 'ADMIN' && effectiveContext === 'admin') {
      goalWhereClause.employeeId = employeeId;
    }

    // Department filter
    if (department && department !== 'all' && effectiveContext !== 'employee') {
      goalWhereClause.department = department;
      userWhereClause.department = department;
    }

    // ──────────────────────────────────────────────────────────────
    // Run ALL aggregation queries in a single Promise.all
    // Each uses DB-level GROUP BY — no large dataset loaded into memory
    // ──────────────────────────────────────────────────────────────
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const [
      statusBreakdown,
      categoryBreakdown,
      priorityBreakdown,
      departmentBreakdown,
      overdueCount,
      userCount,
      // For employee performance we still need per-employee data,
      // but only id + status + rating scores — minimal select
      employeeGoalsRaw
    ] = await Promise.all([
      // 1. Goals grouped by status
      prisma.goal.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: goalWhereClause as any
      }),

      // 2. Goals grouped by category
      prisma.goal.groupBy({
        by: ['category'],
        _count: { _all: true },
        where: goalWhereClause as any
      }),

      // 3. Goals grouped by priority
      prisma.goal.groupBy({
        by: ['priority'],
        _count: { _all: true },
        where: goalWhereClause as any
      }),

      // 4. Goals grouped by department
      prisma.goal.groupBy({
        by: ['department'],
        _count: { _all: true },
        where: goalWhereClause as any
      }),

      // 5. Overdue goals count
      prisma.goal.count({
        where: {
          ...(goalWhereClause as any),
          status: { notIn: ['COMPLETED', 'DELETED'] },
          dueDate: { lt: now }
        }
      }),

      // 6. User count
      prisma.user.count({ where: userWhereClause as any }),

      // 7. Employee performance — minimal fields only
      prisma.goal.findMany({
        where: goalWhereClause as any,
        select: {
          employeeId: true,
          status: true,
          createdAt: true,
          rating: {
            select: { selfScore: true, managerScore: true }
          },
          employee: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);

    // ── Transform groupBy results into Record<string, number> ──
    const byStatus: Record<string, number> = {};
    for (const row of statusBreakdown) {
      if (row._count._all > 0) byStatus[row.status] = row._count._all;
    }

    const byCategory: Record<string, number> = {};
    for (const row of categoryBreakdown) {
      if (row._count._all > 0) byCategory[row.category] = row._count._all;
    }

    const byPriority: Record<string, number> = {};
    for (const row of priorityBreakdown) {
      if (row._count._all > 0) byPriority[row.priority] = row._count._all;
    }

    const byDepartment: Record<string, number> = {};
    for (const row of departmentBreakdown) {
      if (row._count._all > 0) byDepartment[row.department] = row._count._all;
    }

    // ── Compute summary from the status breakdown (no extra query) ──
    const totalGoals = Object.values(byStatus).reduce((s, n) => s + n, 0);
    const completedGoals = byStatus['COMPLETED'] || 0;
    // Completion rate excludes DRAFT/PENDING/REJECTED from denominator
    // Only count goals that are "in flight" or completed (actionable goals)
    const actionableGoals =
      (byStatus['APPROVED'] || 0) +
      (byStatus['IN_PROGRESS'] || 0) +
      (byStatus['COMPLETED'] || 0) +
      (byStatus['ON_HOLD'] || 0) +
      (byStatus['BLOCKED'] || 0);
    const completionRate = actionableGoals > 0 ? (completedGoals / actionableGoals) * 100 : 0;

    // ── Monthly trend from employeeGoalsRaw (lightweight iteration) ──
    const monthlyTrend: Record<string, number> = {};
    for (const g of employeeGoalsRaw) {
      const month = g.createdAt.toISOString().slice(0, 7);
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    }

    // ── Rating stats from employeeGoalsRaw ──
    let ratedGoals = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    for (const g of employeeGoalsRaw) {
      if (g.rating && (g.rating.selfScore !== null || g.rating.managerScore !== null)) {
        ratedGoals++;
        const score = avgScore(g.rating.selfScore, g.rating.managerScore);
        if (score !== null) {
          ratingSum += score;
          ratingCount++;
        }
      }
    }
    const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
    const ratingCompletionRate = totalGoals > 0 ? (ratedGoals / totalGoals) * 100 : 0;

    // ── Employee performance (aggregated from employeeGoalsRaw) ──
    const empMap = new Map<string, {
      name: string;
      email: string;
      total: number;
      completed: number;
      ratingSum: number;
      ratingCount: number;
    }>();

    for (const g of employeeGoalsRaw) {
      const empId = g.employeeId;

      // Filter based on context
      if (effectiveContext === 'employee' || userRole === 'EMPLOYEE') {
        if (empId !== userId) continue;
      } else if (effectiveContext === 'manager' || userRole === 'MANAGER') {
        if (empId === userId) continue;
        if (!managedEmployeeIds.includes(empId)) continue;
      }

      let entry = empMap.get(empId);
      if (!entry) {
        entry = {
          name: g.employee.name,
          email: g.employee.email,
          total: 0,
          completed: 0,
          ratingSum: 0,
          ratingCount: 0
        };
        empMap.set(empId, entry);
      }

      entry.total++;
      if (g.status === 'COMPLETED') entry.completed++;

      const score = g.rating ? avgScore(g.rating.selfScore, g.rating.managerScore) : null;
      if (score !== null) {
        entry.ratingSum += score;
        entry.ratingCount++;
      }
    }

    const employeePerformance = Array.from(empMap.entries())
      .map(([empId, e]) => ({
        employeeId: empId,
        employeeName: e.name,
        employeeEmail: e.email,
        totalGoals: e.total,
        completedGoals: e.completed,
        averageRating: e.ratingCount > 0 ? e.ratingSum / e.ratingCount : 0,
        completionRate: e.total > 0 ? (e.completed / e.total) * 100 : 0
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      summary: {
        totalGoals,
        completedGoals,
        inProgressGoals: byStatus['IN_PROGRESS'] || 0,
        pendingGoals: byStatus['PENDING'] || 0,
        approvedGoals: byStatus['APPROVED'] || 0,
        draftGoals: byStatus['DRAFT'] || 0,
        completionRate: round2(completionRate),
        ratedGoals,
        ratingCompletionRate: round2(ratingCompletionRate),
        averageRating: round2(averageRating),
        overdueGoals: overdueCount,
        totalUsers: userCount,
        activeUsers: userCount // already filtered to isActive
      },
      breakdowns: { byStatus, byCategory, byPriority, byDepartment },
      trends: { monthly: monthlyTrend },
      employeePerformance,
      meta: {
        role: userRole,
        dateRange: { start: startDate || null, end: endDate || null },
        filters: {
          employeeId: employeeId && employeeId !== 'all' ? employeeId : null,
          department: department && department !== 'all' ? department : null
        }
      }
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('too many clients') || errorMessage.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection limit reached. Please try again in a moment.', retryAfter: 5 },
        { status: 503, headers: { 'Retry-After': '5' } }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// ── Helpers ──

function avgScore(self: number | null | undefined, manager: number | null | undefined): number | null {
  const s = self ?? null;
  const m = manager ?? null;
  if (s !== null && m !== null) return (s + m) / 2;
  if (m !== null) return m;
  if (s !== null) return s;
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptySummary() {
  return {
    totalGoals: 0, completedGoals: 0, inProgressGoals: 0, pendingGoals: 0,
    approvedGoals: 0, draftGoals: 0, completionRate: 0, ratedGoals: 0,
    ratingCompletionRate: 0, averageRating: 0, overdueGoals: 0, totalUsers: 0, activeUsers: 0
  };
}

function emptyBreakdowns() {
  return { byStatus: {}, byCategory: {}, byPriority: {}, byDepartment: {} };
}
