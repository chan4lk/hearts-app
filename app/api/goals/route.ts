export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimit';
import { getPaginationFromSearchParams, getPaginationMeta, PAGINATION_LIMITS } from '@/lib/pagination';
import { createGoalSchema } from '@/lib/validation';

// UUID validation helper
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Define GoalStatus enum locally
enum GoalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  MODIFIED = 'MODIFIED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  DELETED = 'DELETED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  BLOCKED = 'BLOCKED',
}

// Define valid status transitions
type StatusTransitions = {
  [key in GoalStatus]: GoalStatus[];
};

/**
 * GOAL STATE MACHINE — Clean workflow:
 *
 * Employee creates → DRAFT
 *   Employee submits → PENDING (waiting for manager review)
 *   Manager reviews → APPROVED / REJECTED / MODIFIED (request changes)
 *
 * REJECTED → Employee revises → DRAFT → resubmit → PENDING
 * MODIFIED → Employee updates → PENDING (resubmit for review)
 *
 * APPROVED → Employee works:
 *   → IN_PROGRESS → ON_HOLD / BLOCKED → back to IN_PROGRESS
 *   → COMPLETED (terminal)
 *
 * Manager assigns → APPROVED directly (skips review)
 */
const validTransitions: StatusTransitions = {
  [GoalStatus.DRAFT]:       [GoalStatus.PENDING],                                                    // Employee submits for review
  [GoalStatus.PENDING]:     [GoalStatus.APPROVED, GoalStatus.REJECTED, GoalStatus.MODIFIED],         // Manager reviews
  [GoalStatus.MODIFIED]:    [GoalStatus.PENDING, GoalStatus.DRAFT],                                  // Employee revises and resubmits
  [GoalStatus.APPROVED]:    [GoalStatus.IN_PROGRESS, GoalStatus.COMPLETED],                          // Employee starts work
  [GoalStatus.REJECTED]:    [GoalStatus.DRAFT],                                                      // Employee revises
  [GoalStatus.IN_PROGRESS]: [GoalStatus.COMPLETED, GoalStatus.ON_HOLD, GoalStatus.BLOCKED],          // Employee tracks work
  [GoalStatus.ON_HOLD]:     [GoalStatus.IN_PROGRESS, GoalStatus.COMPLETED],                          // Resume or complete
  [GoalStatus.BLOCKED]:     [GoalStatus.IN_PROGRESS, GoalStatus.COMPLETED],                          // Unblock or complete
  [GoalStatus.COMPLETED]:   [],                                                                       // Terminal
  [GoalStatus.DELETED]:     []                                                                        // Terminal
};

// Standard include for goal queries
const goalInclude = {
  employee: {
    select: { id: true, name: true, email: true }
  },
  manager: {
    select: { id: true, name: true, email: true }
  },
  createdBy: {
    select: { id: true, name: true, email: true }
  },
  updatedBy: {
    select: { id: true, name: true, email: true }
  },
  rating: {
    select: {
      id: true,
      selfScore: true,
      selfComments: true,
      selfRatedById: true,
      selfRatedAt: true,
      managerScore: true,
      managerComments: true,
      managerRatedById: true,
      managerRatedAt: true,
      createdAt: true,
      updatedAt: true
    }
  }
};

// Helper to calculate stats from goals array
function calculateStats(goals: any[]) {
  return {
    total: goals.length,
    completed: goals.filter(g => g.status === 'COMPLETED').length,
    pending: goals.filter(g => g.status === 'PENDING').length,
    approved: goals.filter(g => g.status === 'APPROVED').length,
    draft: goals.filter(g => g.status === 'DRAFT').length,
    rejected: goals.filter(g => g.status === 'REJECTED').length,
    modified: goals.filter(g => g.status === 'MODIFIED').length,
    // A goal is rated if it has a rating record with either selfScore or managerScore
    selfRated: goals.filter(g => g.rating?.selfScore != null).length,
    managerRated: goals.filter(g => g.rating?.managerScore != null).length,
    rated: goals.filter(g => g.rating?.selfScore != null || g.rating?.managerScore != null).length,
    unrated: goals.filter(g => !g.rating || (g.rating.selfScore == null && g.rating.managerScore == null)).length
  };
}

/**
 * UNIFIED GOALS API
 *
 * Query Parameters:
 * - view: 'my-goals' | 'team-goals' | 'pending-approval' | 'all' (admin only)
 * - status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'MODIFIED'
 * - employeeId: specific employee's goals (for managers/admins)
 * - includeRatings: 'true' to include ratings data
 *
 * Default behavior by role:
 * - EMPLOYEE: Returns their own goals (view=my-goals)
 * - MANAGER: Returns team goals (view=team-goals)
 * - ADMIN: Returns all goals (view=all)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search'); // Search in title/description
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Pagination parameters with limits
    const { page, limit, skip } = getPaginationFromSearchParams(
      searchParams,
      PAGINATION_LIMITS.GOALS
    );
    
    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const userRole = session.user.role;
    const userId = session.user.id;

    // Build the where clause based on parameters
    let whereClause: any = {
      status: { not: 'DELETED' }
    };

    // Add status filter if specified
    if (status && Object.values(GoalStatus).includes(status as GoalStatus)) {
      whereClause.status = status;
    }
    
    // Add category filter if specified
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    // Add priority filter if specified
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }
    
    // Determine which goals to fetch based on view and role
    const effectiveView = view || (
      userRole === 'ADMIN' ? 'all' :
      userRole === 'MANAGER' ? 'team-goals' :
      'my-goals'
    );

    // Add date range filter if specified (validate dates first)
    if (startDate || endDate) {
      whereClause.dueDate = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (!isNaN(parsedStart.getTime())) {
          whereClause.dueDate.gte = parsedStart;
        }
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (!isNaN(parsedEnd.getTime())) {
          whereClause.dueDate.lte = parsedEnd;
        }
      }
      // Remove empty dueDate filter if no valid dates
      if (Object.keys(whereClause.dueDate).length === 0) {
        delete whereClause.dueDate;
      }
    }

    // Build OR conditions array for complex queries (team-goals view)
    const orConditions: any[] = [];

    switch (effectiveView) {
      case 'my-goals':
        // Current user's goals (works for all roles)
        whereClause.employeeId = userId;
        break;

      case 'team-goals':
        // Goals of employees managed by this user (MANAGER/ADMIN only)
        if (userRole !== 'MANAGER' && userRole !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get employees managed by this manager
        const managedEmployees = await prisma.user.findMany({
          where: { managerId: userId },
          select: { id: true }
        });
        const employeeIds = managedEmployees.map(e => e.id);

        // If specific employeeId filter is provided, validate it's a managed employee
        let filteredEmployeeIds = employeeIds;
        if (employeeId) {
          if (!employeeIds.includes(employeeId)) {
            // Employee not managed by this manager, return empty results
            filteredEmployeeIds = [];
          } else {
            // Filter to only this specific employee
            filteredEmployeeIds = [employeeId];
          }
        }

        // Only include goals for assigned employees (exclude manager's own goals)
        // Include: 1) Goals assigned by manager to employees, 2) Self-created goals by assigned employees
        if (filteredEmployeeIds.length > 0) {
          orConditions.push(
            // Manager-assigned goals (managerId = userId AND employeeId is in managed employees)
            { 
              managerId: userId,
              employeeId: { in: filteredEmployeeIds }
            },
            // Employee self-created goals (created by assigned employees, not assigned by manager)
            {
              employeeId: { in: filteredEmployeeIds },
              managerId: null
            }
          );
        } else {
          // No managed employees or invalid employee filter, return empty results
          orConditions.push({ employeeId: 'INVALID' });
        }
        break;

      case 'pending-approval':
        // DRAFT, APPROVED, and REJECTED goals for manager to review (MANAGER/ADMIN only)
        // Managers can review and change status multiple times
        if (userRole !== 'MANAGER' && userRole !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const pendingEmployees = await prisma.user.findMany({
          where: { managerId: userId },
          select: { id: true }
        });

        // Include DRAFT, APPROVED, and REJECTED goals so managers can review and change status
        whereClause.status = { in: ['DRAFT', 'APPROVED', 'REJECTED'] };
        whereClause.employeeId = { in: pendingEmployees.map(e => e.id) };
        break;

      case 'all':
        // All goals (ADMIN only)
        if (userRole !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // If specific employeeId filter is provided, filter by that employee
        if (employeeId) {
          whereClause.employeeId = employeeId;
        }
        // Otherwise, get all non-deleted goals (no additional filter needed)
        break;

      default:
        // If specific employeeId provided (MANAGER/ADMIN can view specific employee)
        if (employeeId) {
          if (userRole !== 'MANAGER' && userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          whereClause.employeeId = employeeId;
        } else {
          // Default to user's own goals
          whereClause.employeeId = userId;
        }
    }

    // Add OR conditions if we have team-goals view
    if (orConditions.length > 0) {
      whereClause.OR = orConditions;
    }

    // Add search filter (applied as AND with other conditions)
    if (search && search.trim()) {
      // If we already have an OR clause (from team-goals), we need to restructure
      // Otherwise, just add the search as AND condition
      if (whereClause.OR && orConditions.length > 0) {
        // For team-goals with search, we need to combine conditions properly
        whereClause.AND = [
          { OR: orConditions },
          {
            OR: [
              { title: { contains: search.trim(), mode: 'insensitive' as const } },
              { description: { contains: search.trim(), mode: 'insensitive' as const } }
            ]
          }
        ];
        delete whereClause.OR;
      } else {
        // Simple search without team-goals
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({
          OR: [
            { title: { contains: search.trim(), mode: 'insensitive' as const } },
            { description: { contains: search.trim(), mode: 'insensitive' as const } }
          ]
        });
      }
    }

    // Determine sort order
    const orderBy: any = {};
    if (sortBy === 'title' || sortBy === 'status' || sortBy === 'priority' || sortBy === 'category') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'dueDate') {
      orderBy.dueDate = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Run paginated goals, count, and stats aggregation in parallel
    const [goals, total, statusAgg, categoryAgg, ratingAgg] = await Promise.all([
      // 1. Paginated goals with relations
      prisma.goal.findMany({
        where: whereClause,
        include: goalInclude,
        orderBy,
        skip,
        take: limit
      }),
      // 2. Total count for pagination
      prisma.goal.count({ where: whereClause }),
      // 3. Status breakdown via DB groupBy (replaces loading all goals)
      prisma.goal.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: whereClause
      }),
      // 4. Category breakdown via DB groupBy
      prisma.goal.groupBy({
        by: ['category'],
        _count: { _all: true },
        where: whereClause
      }),
      // 5. Rating counts via DB (replaces loading all goals for rating stats)
      prisma.rating.count({
        where: {
          goal: whereClause,
          OR: [
            { selfScore: { not: null } },
            { managerScore: { not: null } }
          ]
        }
      })
    ]);

    // Build stats from aggregations (no large dataset in memory)
    const statusMap: Record<string, number> = {};
    for (const row of statusAgg) {
      statusMap[row.status] = row._count._all;
    }

    const totalGoals = Object.values(statusMap).reduce((s, n) => s + n, 0);
    const stats = {
      total: totalGoals,
      completed: statusMap['COMPLETED'] || 0,
      pending: statusMap['PENDING'] || 0,
      approved: statusMap['APPROVED'] || 0,
      draft: statusMap['DRAFT'] || 0,
      rejected: statusMap['REJECTED'] || 0,
      modified: statusMap['MODIFIED'] || 0,
      selfRated: 0, // These detailed breakdowns require the old approach; use ratingAgg for total
      managerRated: 0,
      rated: ratingAgg,
      unrated: totalGoals - ratingAgg,
      categories: {} as Record<string, number>
    };

    for (const row of categoryAgg) {
      if (row._count._all > 0) {
        stats.categories[row.category] = row._count._all;
      }
    }

    return NextResponse.json({
      success: true,
      goals,
      stats,
      pagination: getPaginationMeta(page, limit, total),
      meta: {
        view: effectiveView,
        role: userRole,
        count: goals.length,
        total
      }
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate with Zod schema (replaces manual field checks)
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { title, description, category, dueDate } = parsed.data;
    const { employeeId, department, priority } = body;

    const userRole = session.user.role;
    const userId = session.user.id;
    const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

    // Determine the target employee
    const targetEmployeeId = employeeId || userId;
    const isSelfGoal = targetEmployeeId === userId;

    // Non-managers can only create goals for themselves
    if (!isAdminOrManager && !isSelfGoal) {
      return NextResponse.json(
        { error: 'You can only create goals for yourself' },
        { status: 403 }
      );
    }

    // Determine initial status:
    // - Manager/Admin assigns goal to employee → APPROVED (employee can start immediately)
    // - Employee creates goal for themselves → DRAFT (needs manager review)
    let initialStatus: GoalStatus;
    if (isAdminOrManager && !isSelfGoal) {
      // Manager assigning goal to employee
      initialStatus = GoalStatus.APPROVED;
    } else {
      // Employee creating goal for themselves
      initialStatus = GoalStatus.DRAFT;
    }

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        category: category || 'PROFESSIONAL',
        department: department || 'ENGINEERING',
        priority: priority || 'MEDIUM',
        dueDate: new Date(dueDate),
        status: initialStatus,
        employeeId: targetEmployeeId,
        managerId: isAdminOrManager && !isSelfGoal ? userId : null,
        createdById: userId,
        updatedById: userId
      },
      include: goalInclude
    });

    // Create notifications
    const { NotificationType } = await import('@prisma/client');
    
    // Notify employee when goal is created
    await prisma.notification.create({
      data: {
        type: NotificationType.GOAL_CREATED,
        message: isAdminOrManager && !isSelfGoal
          ? `A new goal "${goal.title}" has been assigned to you by ${session.user.name || 'your manager'}`
          : `You created a new goal "${goal.title}" (status: ${goal.status})`,
        userId: targetEmployeeId,
        goalId: goal.id,
      },
    });

    // If manager assigns goal, notify manager about the assignment
    if (isAdminOrManager && !isSelfGoal) {
      await prisma.notification.create({
        data: {
          type: NotificationType.GOAL_CREATED,
          message: `You assigned goal "${goal.title}" to ${goal.employee?.name || 'employee'}`,
          userId: userId,
          goalId: goal.id,
        },
      });
    }

    // If employee creates DRAFT goal, notify their manager
    if (isSelfGoal && initialStatus === GoalStatus.DRAFT) {
      // Fetch employee with manager info
      const employeeWithManager = await prisma.user.findUnique({
        where: { id: targetEmployeeId },
        select: { id: true, name: true, email: true, managerId: true }
      });
      
      if (employeeWithManager?.managerId) {
        await prisma.notification.create({
          data: {
            type: NotificationType.GOAL_CREATED,
            message: `${employeeWithManager.name || 'Employee'} created a new goal "${goal.title}" that needs your review`,
            userId: employeeWithManager.managerId,
            goalId: goal.id,
          },
        });
      }
    }

    // Don't log sensitive goal data - security risk

    return NextResponse.json({
      success: true,
      goal
    }, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the goal ID from the URL path
    const url = new URL(request.url);
    const goalId = url.pathname.split('/').pop();

    if (!goalId || !isValidUUID(goalId)) {
      return NextResponse.json(
        { error: 'Valid goal ID is required' },
        { status: 400 }
      );
    }

    // Check if user is authorized to delete the goal
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { 
        manager: true,
        employee: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check authorization
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    const isGoalManager = goal.managerId === session.user.id;
    const isGoalEmployee = goal.employeeId === session.user.id;

    // Allow deletion if:
    // 1. User is ADMIN (can delete any goal)
    // 2. User is the manager who assigned the goal (can delete goals they assigned)
    // 3. User is the employee and goal is in DRAFT state
    if (
      !(session.user.role === 'ADMIN') && 
      !isGoalManager && 
      !(isGoalEmployee && goal.status === 'DRAFT')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this goal' },
        { status: 403 }
      );
    }

    // Soft delete by updating status to DELETED
    const deletedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
        updatedBy: {
          connect: {
            id: session.user.id
          }
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(deletedGoal);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the goal ID from the URL path
    const url = new URL(request.url);
    const goalId = url.pathname.split('/').pop();

    if (!goalId || !isValidUUID(goalId)) {
      return NextResponse.json(
        { error: 'Valid goal ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, managerComments, title, description, dueDate, category, department, priority } = body;

    // Check if user is authorized to update the goal
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { 
        manager: true,
        employee: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check authorization based on role and status
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    const isGoalManager = goal.managerId === session.user.id;
    const isGoalEmployee = goal.employeeId === session.user.id;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: {
        connect: {
          id: session.user.id
        }
      }
    };

    // Handle status update if provided
    if (status) {
      const currentStatus = goal.status as GoalStatus;
      const newStatus = status as GoalStatus;
      
      // Check if the status transition is valid
      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: 'Invalid status transition' },
          { status: 400 }
        );
      }

      // Check if user has permission for this status change
      if (
        (newStatus === 'PENDING' && !isGoalEmployee) ||
        (['APPROVED', 'REJECTED', 'MODIFIED'].includes(newStatus) && !isAdminOrManager) ||
        (['COMPLETED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED'].includes(newStatus) && !isGoalEmployee && !isAdminOrManager) ||
        (newStatus === 'DRAFT' && !isGoalEmployee)
      ) {
        return NextResponse.json({ error: 'Unauthorized status change' }, { status: 403 });
      }

      updateData.status = newStatus;

      // Add manager comments if applicable
      if (['APPROVED', 'REJECTED', 'MODIFIED'].includes(newStatus) && managerComments) {
        updateData.managerComments = managerComments;
      }
    }

    // Handle content updates if provided
    if (title || description || dueDate || category || department || priority) {
      // Only allow content updates if:
      // 1. User is admin/manager and goal is in DRAFT or PENDING state
      // 2. User is the employee and goal is in DRAFT state
      if (
        !isAdminOrManager && 
        !(isGoalEmployee && goal.status === 'DRAFT')
      ) {
        return NextResponse.json(
          { error: 'Unauthorized to update goal content' },
          { status: 403 }
        );
      }

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (category) updateData.category = category;
      if (department) updateData.department = department;
      if (priority) updateData.priority = priority;
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
} 