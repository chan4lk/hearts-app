export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

const validTransitions: StatusTransitions = {
  [GoalStatus.DRAFT]: [GoalStatus.PENDING, GoalStatus.APPROVED, GoalStatus.REJECTED, GoalStatus.MODIFIED], // Employee can submit DRAFT to PENDING, or Manager can review DRAFT directly
  [GoalStatus.PENDING]: [GoalStatus.APPROVED, GoalStatus.REJECTED, GoalStatus.MODIFIED], // Manager reviews submitted DRAFT
  [GoalStatus.MODIFIED]: [GoalStatus.PENDING, GoalStatus.DRAFT], // Employee resubmits after modifications (can go back to DRAFT or submit to PENDING)
  [GoalStatus.APPROVED]: [GoalStatus.IN_PROGRESS, GoalStatus.COMPLETED, GoalStatus.ON_HOLD, GoalStatus.BLOCKED], // Employee can start working
  [GoalStatus.IN_PROGRESS]: [GoalStatus.COMPLETED, GoalStatus.ON_HOLD, GoalStatus.BLOCKED],
  [GoalStatus.REJECTED]: [GoalStatus.DRAFT], // Employee can revise and resubmit
  [GoalStatus.COMPLETED]: [],
  [GoalStatus.ON_HOLD]: [GoalStatus.IN_PROGRESS, GoalStatus.COMPLETED],
  [GoalStatus.BLOCKED]: [GoalStatus.IN_PROGRESS, GoalStatus.COMPLETED],
  [GoalStatus.DELETED]: []
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

    // Determine which goals to fetch based on view and role
    const effectiveView = view || (
      userRole === 'ADMIN' ? 'all' :
      userRole === 'MANAGER' ? 'team-goals' :
      'my-goals'
    );

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

        // Include manager's own goals + managed employees' goals
        whereClause.OR = [
          { employeeId: { in: employeeIds } },
          { employeeId: userId },
          { managerId: userId }
        ];
        break;

      case 'pending-approval':
        // Pending goals for manager to review (MANAGER/ADMIN only)
        if (userRole !== 'MANAGER' && userRole !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const pendingEmployees = await prisma.user.findMany({
          where: { managerId: userId },
          select: { id: true }
        });

        whereClause.status = 'PENDING';
        whereClause.employeeId = { in: pendingEmployees.map(e => e.id) };
        break;

      case 'all':
        // All goals (ADMIN only)
        if (userRole !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // No additional filter - get all non-deleted goals
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

    // Fetch goals with all related data
    const goals = await prisma.goal.findMany({
      where: whereClause,
      include: goalInclude,
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const stats = calculateStats(goals);

    // Add category breakdown
    const categoryStats: Record<string, number> = {};
    goals.forEach((goal: any) => {
      if (goal.category) {
        categoryStats[goal.category] = (categoryStats[goal.category] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      goals,
      stats: {
        ...stats,
        categories: categoryStats
      },
      meta: {
        view: effectiveView,
        role: userRole,
        count: goals.length
      }
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, dueDate, employeeId, department, priority } = await req.json();

    // Validate required fields
    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: 'Title, description, and due date are required' },
        { status: 400 }
      );
    }

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

    // Log for debugging - verify status is set correctly
    console.log('Goal created with status:', {
      goalId: goal.id,
      status: goal.status,
      createdBy: userRole,
      isManagerAssigning: isAdminOrManager && !isSelfGoal,
      targetEmployeeId,
      userId
    });

    return NextResponse.json({
      success: true,
      goal
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the goal ID from the URL path
    const url = new URL(request.url);
    const goalId = url.pathname.split('/').pop();

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
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

    // Only allow deletion if:
    // 1. User is admin/manager and goal is in DRAFT or PENDING state
    // 2. User is the employee and goal is in DRAFT state
    if (
      !isAdminOrManager && 
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
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the goal ID from the URL path
    const url = new URL(request.url);
    const goalId = url.pathname.split('/').pop();

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
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
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
} 