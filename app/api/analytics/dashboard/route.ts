export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const context = searchParams.get('context'); // 'admin', 'manager', or 'employee' - dashboard context
    const userRole = session.user.role;
    const userId = session.user.id;
    
    // Only log in development - never log sensitive user data in production
    if (process.env.NODE_ENV === 'development') {
      logger.log('Analytics API request', 'Information', { role: userRole, context });
    }

    // Build date range filter
    const dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      dateFilter.lte = end;
    }

    // Build where clause based on role and dashboard context
    // For admins, context determines data scope: 'admin' = all users, 'employee' = own data, 'manager' = assigned employees
    let goalWhereClause: any = {
      status: { not: 'DELETED' },
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    };

    let userWhereClause: any = {
      isActive: true
    };

    // Determine effective context: use context param for admins, otherwise use role
    const effectiveContext = (userRole === 'ADMIN' && context) ? context : userRole.toLowerCase();

    // Store managed employee IDs for reuse (used in both goal filtering and employee performance)
    let managedEmployeeIds: string[] = [];

    if (effectiveContext === 'employee' || userRole === 'EMPLOYEE') {
      // Employees can only see their own goals
      // For admins viewing in employee context, also show only their own goals
      goalWhereClause.employeeId = userId;
      // Users stats should only include the current user
      userWhereClause.id = userId;
    } else if (effectiveContext === 'manager' || userRole === 'MANAGER') {
      // Manager context: show only assigned employees' data
      // Get managed employees once (will be reused for employee performance section)
      const managedEmployees = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      const employeeIds = managedEmployees.map(e => e.id);
      
      // Manager should only see their assigned employees' data, not their own
      if (employeeIds.length === 0) {
        // No managed employees, return empty results
        goalWhereClause.employeeId = 'INVALID';
      } else {
        // Filter by employee if specified, otherwise show all managed employees
        if (employeeId && employeeId !== 'all') {
          // Validate that the employee is managed by this manager
          if (employeeIds.includes(employeeId)) {
            goalWhereClause.employeeId = employeeId;
          } else {
            // Employee not managed by this manager, return empty results
            goalWhereClause.employeeId = 'INVALID';
          }
        } else {
          // Show only managed employees (exclude manager's own goals)
          goalWhereClause.employeeId = { in: employeeIds };
        }
      }
      
      // User stats should only include managed employees, not the manager
      userWhereClause.managerId = userId;
      
      // Store for later use in employee performance section
      managedEmployeeIds = employeeIds;
    }
    // ADMIN context (or admin role with no context): can see all - no additional filters needed

    // Filter by employee if specified (for admins in admin context only - managers handled above)
    if (employeeId && employeeId !== 'all' && userRole === 'ADMIN' && effectiveContext === 'admin') {
      goalWhereClause.employeeId = employeeId;
    }

    // Filter by department if specified (not for employees - they can't filter by department)
    if (department && department !== 'all' && effectiveContext !== 'employee') {
      goalWhereClause.department = department;
      userWhereClause.department = department;
    }

    // Use parallel database queries for faster performance
    const [
      totalGoalsResult,
      statusCounts,
      categoryCounts,
      priorityCounts,
      departmentCounts,
      monthlyTrends,
      users,
      goalsWithRatings
    ] = await Promise.all([
      // Total goals count
      prisma.goal.count({ where: goalWhereClause }),
      
      // Goals by status (using groupBy for better performance)
      prisma.goal.groupBy({
        by: ['status'],
        where: goalWhereClause,
        _count: { status: true }
      }),
      
      // Goals by category
      prisma.goal.groupBy({
        by: ['category'],
        where: { ...goalWhereClause, category: { not: null } },
        _count: { category: true }
      }),
      
      // Goals by priority
      prisma.goal.groupBy({
        by: ['priority'],
        where: { ...goalWhereClause, priority: { not: null } },
        _count: { priority: true }
      }),
      
      // Goals by department
      prisma.goal.groupBy({
        by: ['department'],
        where: { ...goalWhereClause, department: { not: null } },
        _count: { department: true }
      }),
      
      // Monthly trends - get goals with createdAt for grouping
      prisma.goal.findMany({
        where: goalWhereClause,
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get users for team analysis (limited fields)
      prisma.user.findMany({
        where: userWhereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true
        }
      }),
      
      // Get goals with ratings for performance calculation (only needed fields)
      prisma.goal.findMany({
        where: goalWhereClause,
        select: {
          id: true,
          employeeId: true,
          status: true,
          rating: {
            select: {
              selfScore: true,
              managerScore: true
            }
          },
          employee: {
            select: { id: true, name: true, email: true, department: true }
          }
        }
      })
    ]);

    // Calculate goal statistics from aggregated data
    const totalGoals = totalGoalsResult;
    const completedGoals = statusCounts.find(s => s.status === 'COMPLETED')?._count.status || 0;
    const inProgressGoals = statusCounts.find(s => s.status === 'IN_PROGRESS')?._count.status || 0;
    const pendingGoals = statusCounts.find(s => s.status === 'PENDING')?._count.status || 0;
    const approvedGoals = statusCounts.find(s => s.status === 'APPROVED')?._count.status || 0;
    const draftGoals = statusCounts.find(s => s.status === 'DRAFT')?._count.status || 0;
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Calculate rating statistics from goalsWithRatings
    const ratedGoals = goalsWithRatings.filter(g => 
      g.rating && (g.rating.selfScore !== null || g.rating.managerScore !== null)
    ).length;
    const ratingCompletionRate = totalGoals > 0 ? (ratedGoals / totalGoals) * 100 : 0;

    // Average ratings - optimized calculation
    const ratingsWithScore = goalsWithRatings
      .map(g => {
        if (g.rating) {
          if (g.rating.selfScore !== null && g.rating.managerScore !== null) {
            return (g.rating.selfScore + g.rating.managerScore) / 2;
          } else if (g.rating.managerScore !== null) {
            return g.rating.managerScore;
          } else if (g.rating.selfScore !== null) {
            return g.rating.selfScore;
          }
        }
        return null;
      })
      .filter((r): r is number => r !== null);
    
    const averageRating = ratingsWithScore.length > 0
      ? ratingsWithScore.reduce((sum, r) => sum + r, 0) / ratingsWithScore.length
      : 0;

    // Goals by status - convert from groupBy result
    const goalsByStatus: Record<string, number> = {};
    statusCounts.forEach(item => {
      if (item._count.status > 0) {
        goalsByStatus[item.status] = item._count.status;
      }
    });

    // Goals by category - convert from groupBy result
    const goalsByCategory: Record<string, number> = {};
    categoryCounts.forEach(item => {
      if (item.category && item._count.category > 0) {
        goalsByCategory[item.category] = item._count.category;
      }
    });

    // Goals by priority - convert from groupBy result
    const goalsByPriority: Record<string, number> = {};
    priorityCounts.forEach(item => {
      if (item.priority && item._count.priority > 0) {
        goalsByPriority[item.priority] = item._count.priority;
      }
    });

    // Goals by department - convert from groupBy result
    const goalsByDepartment: Record<string, number> = {};
    departmentCounts.forEach(item => {
      if (item.department && item._count.department > 0) {
        goalsByDepartment[item.department] = item._count.department;
      }
    });

    // Monthly trend - optimized calculation
    const monthlyTrend: Record<string, number> = {};
    monthlyTrends.forEach(goal => {
      const month = new Date(goal.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    });

    // Employee performance (top performers by average rating) - optimized using goalsWithRatings
    const employeePerformance: Array<{
      employeeId: string;
      employeeName: string;
      employeeEmail: string;
      totalGoals: number;
      completedGoals: number;
      averageRating: number;
      completionRate: number;
    }> = [];

    const employeeGoalsMap = new Map<string, typeof goalsWithRatings>();
    goalsWithRatings.forEach(goal => {
      if (!employeeGoalsMap.has(goal.employeeId)) {
        employeeGoalsMap.set(goal.employeeId, []);
      }
      employeeGoalsMap.get(goal.employeeId)!.push(goal);
    });

    employeeGoalsMap.forEach((employeeGoals, empId) => {
      const employee = employeeGoals[0]?.employee;
      if (!employee) return;

      // Filter employee performance based on effective context
      if (effectiveContext === 'employee' || userRole === 'EMPLOYEE') {
        // Employees and admins in employee context: only show their own performance
        if (empId !== userId) {
          return;
        }
      } else if (effectiveContext === 'manager' || userRole === 'MANAGER') {
        // Managers and admins in manager context: exclude their own performance, only show assigned employees
        if (empId === userId) {
          return; // Don't include manager's own performance
        }
        // Verify this employee is actually managed by this user
        if (!managedEmployeeIds.includes(empId)) {
          return; // Not managed by this user, skip
        }
      }
      // Admin context: show all employees (no filtering)

      const completed = employeeGoals.filter(g => g.status === 'COMPLETED').length;
      const ratings = employeeGoals
        .map(g => {
          if (g.rating) {
            if (g.rating.selfScore !== null && g.rating.managerScore !== null) {
              return (g.rating.selfScore + g.rating.managerScore) / 2;
            } else if (g.rating.managerScore !== null) {
              return g.rating.managerScore;
            } else if (g.rating.selfScore !== null) {
              return g.rating.selfScore;
            }
          }
          return null;
        })
        .filter((r): r is number => r !== null);

      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

      employeePerformance.push({
        employeeId: empId,
        employeeName: employee.name,
        employeeEmail: employee.email,
        totalGoals: employeeGoals.length,
        completedGoals: completed,
        averageRating: avgRating,
        completionRate: employeeGoals.length > 0 ? (completed / employeeGoals.length) * 100 : 0
      });
    });

    // Sort by average rating descending (only if multiple employees)
    // For employees, they only see themselves, so sorting doesn't matter
    if (userRole !== 'EMPLOYEE') {
      employeePerformance.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Overdue goals - use database query for better performance
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today for comparison
    const overdueGoals = await prisma.goal.count({
      where: {
        ...goalWhereClause,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now }
      }
    });

    // Ensure all breakdown objects have at least empty objects
    const breakdowns = {
      byStatus: Object.keys(goalsByStatus).length > 0 ? goalsByStatus : {},
      byCategory: Object.keys(goalsByCategory).length > 0 ? goalsByCategory : {},
      byPriority: Object.keys(goalsByPriority).length > 0 ? goalsByPriority : {},
      byDepartment: Object.keys(goalsByDepartment).length > 0 ? goalsByDepartment : {}
    };

    return NextResponse.json({
      success: true,
      summary: {
        totalGoals: totalGoals || 0,
        completedGoals: completedGoals || 0,
        inProgressGoals: inProgressGoals || 0,
        pendingGoals: pendingGoals || 0,
        approvedGoals: approvedGoals || 0,
        draftGoals: draftGoals || 0,
        completionRate: completionRate ? Math.round(completionRate * 100) / 100 : 0,
        ratedGoals: ratedGoals || 0,
        ratingCompletionRate: ratingCompletionRate ? Math.round(ratingCompletionRate * 100) / 100 : 0,
        averageRating: averageRating ? Math.round(averageRating * 100) / 100 : 0,
        overdueGoals: overdueGoals || 0,
        totalUsers: users.length || 0,
        activeUsers: users.filter(u => u.isActive).length || 0
      },
      breakdowns,
      trends: {
        monthly: Object.keys(monthlyTrend).length > 0 ? monthlyTrend : {}
      },
      employeePerformance: employeePerformance.length > 0 ? employeePerformance.slice(0, 10) : [],
      meta: {
        role: userRole,
        dateRange: {
          start: startDate || null,
          end: endDate || null
        },
        filters: {
          employeeId: employeeId && employeeId !== 'all' ? employeeId : null,
          department: department && department !== 'all' ? department : null
        }
      }
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

