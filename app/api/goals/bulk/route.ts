import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoalStatus, GoalCategory } from '@prisma/client';

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

    // Verify all employees exist and are assigned to the current manager
    const employeeIds = Array.from(new Set(body.goals.map(goal => goal.employeeId)));

    console.log('Bulk goal creation - Employee validation:', {
      currentManagerId: session.user.id,
      currentUserRole: session.user.role,
      employeeIdsToValidate: employeeIds
    });

    let assignedEmployees;
    if (session.user.role === 'ADMIN') {
      // Admin can assign goals to any employee
      assignedEmployees = await prisma.user.findMany({
        where: {
          id: { in: employeeIds },
          role: 'EMPLOYEE'
        },
        select: { id: true, name: true, email: true, managerId: true }
      });
    } else {
      // Manager can only assign goals to their assigned employees
      assignedEmployees = await prisma.user.findMany({
        where: {
          id: { in: employeeIds },
          role: 'EMPLOYEE',
          managerId: session.user.id
        },
        select: { id: true, name: true, email: true, managerId: true }
      });
    }

    console.log('Found employees:', assignedEmployees);

    const foundEmployeeIds = new Set(assignedEmployees.map(emp => emp.id));
    const missingEmployeeIds = employeeIds.filter(id => !foundEmployeeIds.has(id));

    if (missingEmployeeIds.length > 0) {
      console.log('Missing employee IDs:', missingEmployeeIds);
      return NextResponse.json({
        success: false,
        message: `Invalid or unassigned employee IDs: ${missingEmployeeIds.join(', ')}`,
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
                status: GoalStatus.DRAFT, // Admin/Manager created goals start as DRAFT
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
          } catch (error) {
            console.error(`Error creating goal ${i}:`, error);
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
      console.error('Transaction failed:', transactionError);
      return NextResponse.json({
        success: false,
        message: transactionError instanceof Error ? transactionError.message : 'Failed to create goals',
        created: 0,
        failed: body.goals.length
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Bulk goal creation error:', error);
    return NextResponse.json({
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
    console.error('Error fetching bulk goal templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
