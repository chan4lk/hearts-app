import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoalStatus, GoalCategory, NotificationType } from '@prisma/client';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

interface BulkGoalData {
  title: string;
  description: string;
  dueDate: string;
  employeeId: string;
  category: string;
  department: string;
  priority: string;
}

interface BulkGoalRequest {
  goals: BulkGoalData[];
}

interface BulkGoalResponse {
  success: boolean;
  message: string;
  created: number;
  failed: number;
  goals?: any[];
  errors?: Array<{
    index: number;
    error: string;
    goal: BulkGoalData;
  }>;
}

export async function POST(req: NextRequest): Promise<NextResponse<BulkGoalResponse>> {
  try {
    // Apply strict rate limiting for bulk operations
    const rateLimitResponse = await rateLimiters.bulk(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', created: 0, failed: 0 },
        { status: 401 }
      );
    }

    // Check if user has permission to create goals
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    if (!isAdminOrManager) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions', created: 0, failed: 0 },
        { status: 403 }
      );
    }

    const body: BulkGoalRequest = await req.json();
    
    if (!body.goals || !Array.isArray(body.goals) || body.goals.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No goals provided', created: 0, failed: 0 },
        { status: 400 }
      );
    }

    if (body.goals.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Maximum 50 goals allowed per batch', created: 0, failed: 0 },
        { status: 400 }
      );
    }

    const errors: Array<{ index: number; error: string; goal: BulkGoalData }> = [];

    // Validate all goals first
    for (let i = 0; i < body.goals.length; i++) {
      const goal = body.goals[i];
      
      // Basic validation
      if (!goal.title?.trim()) {
        errors.push({
          index: i,
          error: 'Goal title is required',
          goal
        });
        continue;
      }

      if (!goal.employeeId?.trim()) {
        errors.push({
          index: i,
          error: 'Employee ID is required',
          goal
        });
        continue;
      }

      if (!goal.dueDate) {
        errors.push({
          index: i,
          error: 'Due date is required',
          goal
        });
        continue;
      }

      // Validate due date
      const dueDate = new Date(goal.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.push({
          index: i,
          error: 'Invalid due date format',
          goal
        });
        continue;
      }

      // Check if due date is in the past
      if (dueDate < new Date()) {
        errors.push({
          index: i,
          error: 'Due date cannot be in the past',
          goal
        });
        continue;
      }

      // Validate category
      const validCategories = ['PROFESSIONAL', 'TECHNICAL', 'LEADERSHIP', 'PERSONAL', 'TRAINING', 'KPI'];
      if (!validCategories.includes(goal.category)) {
        errors.push({
          index: i,
          error: 'Invalid category',
          goal
        });
        continue;
      }

      // Validate priority
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
      if (!validPriorities.includes(goal.priority)) {
        errors.push({
          index: i,
          error: 'Invalid priority',
          goal
        });
        continue;
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Validation failed for ${errors.length} goal(s)`,
        created: 0,
        failed: errors.length,
        errors
      }, { status: 400 });
    }

    // Verify all employees exist
    const employeeIds = Array.from(new Set(body.goals.map(goal => goal.employeeId)));

    // Check if all employees exist (don't require them to be assigned to this manager)
    const existingEmployees = await prisma.user.findMany({
      where: {
        id: { in: employeeIds }
      },
      select: { id: true, name: true, email: true }
    });

    const foundEmployeeIds = new Set(existingEmployees.map(emp => emp.id));
    const missingEmployeeIds = employeeIds.filter(id => !foundEmployeeIds.has(id));

    if (missingEmployeeIds.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Invalid employee IDs: ${missingEmployeeIds.join(', ')}`,
        created: 0,
        failed: body.goals.length
      }, { status: 400 });
    }

    // Create goals in a transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        const createdGoals = [];
        
        for (let i = 0; i < body.goals.length; i++) {
          const goalData = body.goals[i];
          
          try {
            const goal = await tx.goal.create({
              data: {
                title: goalData.title.trim(),
                description: goalData.description?.trim() || '',
                category: goalData.category as GoalCategory,
                department: goalData.department || 'ENGINEERING',
                priority: goalData.priority || 'MEDIUM',
                dueDate: new Date(goalData.dueDate),
                status: GoalStatus.APPROVED, // Manager assigned goals start as APPROVED (employee can start immediately)
                employeeId: goalData.employeeId,
                managerId: session.user.id,
                createdById: session.user.id,
                updatedById: session.user.id
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
            
            createdGoals.push(goal);
            
            // Create notification for employee when goal is bulk assigned
            await tx.notification.create({
              data: {
                type: NotificationType.GOAL_CREATED,
                message: `A new goal "${goal.title}" has been assigned to you by ${session.user.name || 'your manager'}`,
                userId: goal.employeeId,
                goalId: goal.id,
              },
            });
          } catch (error) {
            logger.error(error instanceof Error ? error : new Error(String(error)));
            throw new Error(`Failed to create goal ${i + 1}: ${goalData.title}`);
          }
        }
        
        return createdGoals;
      });

      return NextResponse.json({
        success: true,
        message: `Successfully created ${result.length} goal(s)`,
        created: result.length,
        failed: 0,
        goals: result
      }, { status: 201 });

    } catch (transactionError) {
      logger.error(transactionError instanceof Error ? transactionError : new Error(String(transactionError)));
      return NextResponse.json({
        success: false,
        message: transactionError instanceof Error ? transactionError.message : 'Failed to create goals',
        created: 0,
        failed: body.goals.length
      }, { status: 500 });
    }

  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// GET endpoint to retrieve bulk goal creation templates
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can access bulk goal templates
    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return template structure
    return NextResponse.json({
      template: {
        goals: [
          {
            title: 'Example Goal Title',
            description: 'Example goal description',
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            employeeId: 'employee-id-here',
            category: 'PROFESSIONAL',
            department: 'ENGINEERING',
            priority: 'MEDIUM'
          }
        ]
      },
      categories: Object.values(GoalCategory),
      priorities: ['LOW', 'MEDIUM', 'HIGH']
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
      success: false,
      message: 'Internal server error',
      created: 0,
      failed: 0
    }, { status: 500 });
  }
}

// GET endpoint to retrieve bulk goal creation templates
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';
    if (!isAdminOrManager) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Return goal templates for bulk creation
    const templates = [
      {
        id: 'quarterly-review',
        name: 'Quarterly Performance Review',
        category: 'PROFESSIONAL',
        priority: 'HIGH',
        description: 'Complete quarterly performance review and set goals for next quarter',
        estimatedDuration: '30 days'
      },
      {
        id: 'skill-development',
        name: 'Skill Development',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        description: 'Develop new technical skills relevant to current role',
        estimatedDuration: '60 days'
      },
      {
        id: 'team-collaboration',
        name: 'Team Collaboration',
        category: 'LEADERSHIP',
        priority: 'MEDIUM',
        description: 'Improve team collaboration and communication skills',
        estimatedDuration: '45 days'
      },
      {
        id: 'project-completion',
        name: 'Project Completion',
        category: 'KPI',
        priority: 'HIGH',
        description: 'Complete assigned project within deadline and quality standards',
        estimatedDuration: '90 days'
      },
      {
        id: 'training-certification',
        name: 'Training & Certification',
        category: 'TRAINING',
        priority: 'MEDIUM',
        description: 'Complete required training and obtain relevant certification',
        estimatedDuration: '60 days'
      }
    ];

    return NextResponse.json({ templates }, { status: 200 });

  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
