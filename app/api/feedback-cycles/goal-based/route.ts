import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, PrismaClient } from '.prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and managers can create goal-based feedback cycles
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      type, 
      startDate, 
      endDate, 
      competencyIds,
      goalId,           // Specific goal to target
      goalCategory,     // Goal category to target
      employeeIds,      // Specific employees to include
      includeSelf = true,
      includeManager = true,
      includePeers = true,
      includeSubordinates = false,
      maxPeers = 2
    } = body;

    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate goal if provided
    if (goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: { employee: true }
      });

      if (!goal) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }

      // Managers can only create cycles for their team members' goals
      if (session.user.role === Role.MANAGER) {
        const managerEmployees = await prisma.user.findMany({
          where: { managerId: session.user.id },
          select: { id: true }
        });
        
        if (!managerEmployees.find((emp: any) => emp.id === goal.employeeId)) {
          return NextResponse.json({ error: 'You can only create feedback cycles for your team members' }, { status: 403 });
        }
      }
    }

    // Create the feedback cycle
    const cycle = await prisma.feedbackCycle.create({
      data: {
        name,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: session.user.id,
        goalId,
        goalCategory,
        competencies: {
          connect: competencyIds?.map((id: string) => ({ id })) || []
        }
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        competencies: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        goal: {
          select: {
            id: true,
            title: true,
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Determine target employees
    let targetEmployees: any[] = [];

    if (employeeIds && employeeIds.length > 0) {
      // Specific employees provided
      targetEmployees = await prisma.user.findMany({
        where: { 
          id: { in: employeeIds },
          isActive: true
        },
        include: {
          manager: true,
          employees: true
        }
      });
    } else if (goalId) {
      // Target the goal owner
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          employee: {
            include: {
              manager: true,
              employees: true
            }
          }
        }
      });
      if (goal) {
        targetEmployees = [goal.employee];
      }
    } else if (goalCategory) {
      // Target employees with goals in the specified category
      const goals = await prisma.goal.findMany({
        where: { 
          category: goalCategory,
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        include: {
          employee: {
            include: {
              manager: true,
              employees: true
            }
          }
        }
      });
      targetEmployees = goals.map((g: any) => g.employee);
    } else {
      // Target all employees under the manager (for managers) or all employees (for admins)
      if (session.user.role === Role.MANAGER) {
        targetEmployees = await prisma.user.findMany({
          where: { 
            managerId: session.user.id,
            isActive: true
          },
          include: {
            manager: true,
            employees: true
          }
        });
      } else {
        targetEmployees = await prisma.user.findMany({
          where: { isActive: true },
          include: {
            manager: true,
            employees: true
          }
        });
      }
    }

    // Remove duplicates
    const uniqueEmployees = targetEmployees.filter((emp: any, index: number, self: any[]) => 
      index === self.findIndex((e: any) => e.id === emp.id)
    );

    // Create feedback assignments
    const assignments = [];
    const errors = [];

    for (const employee of uniqueEmployees) {
      try {
        // Self feedback
        if (includeSelf) {
          await prisma.feedback360.create({
            data: {
              cycleId: cycle.id,
              employeeId: employee.id,
              reviewerId: employee.id,
              reviewerType: 'SELF',
              isAnonymous: false,
              isCompleted: false
            }
          });
          assignments.push({ type: 'SELF', employee: employee.name });
        }

        // Manager feedback
        if (includeManager && employee.managerId) {
          await prisma.feedback360.create({
            data: {
              cycleId: cycle.id,
              employeeId: employee.id,
              reviewerId: employee.managerId,
              reviewerType: 'MANAGER',
              isAnonymous: false,
              isCompleted: false
            }
          });
          assignments.push({ type: 'MANAGER', employee: employee.name, reviewer: employee.manager?.name });
        }

        // Peer feedback
        if (includePeers) {
          const peers = uniqueEmployees.filter((u: any) => 
            u.id !== employee.id && 
            u.department === employee.department &&
            u.role === employee.role
          ).slice(0, maxPeers);

          for (const peer of peers) {
            await prisma.feedback360.create({
              data: {
                cycleId: cycle.id,
                employeeId: employee.id,
                reviewerId: peer.id,
                reviewerType: 'PEER',
                isAnonymous: true,
                isCompleted: false
              }
            });
            assignments.push({ type: 'PEER', employee: employee.name, reviewer: peer.name });
          }
        }

        // Subordinate feedback
        if (includeSubordinates && employee.role === 'MANAGER' && employee.employees.length > 0) {
          for (const subordinate of employee.employees) {
            await prisma.feedback360.create({
              data: {
                cycleId: cycle.id,
                employeeId: employee.id,
                reviewerId: subordinate.id,
                reviewerType: 'SUBORDINATE',
                isAnonymous: true,
                isCompleted: false
              }
            });
            assignments.push({ type: 'SUBORDINATE', employee: employee.name, reviewer: subordinate.name });
          }
        }

      } catch (error) {
        errors.push({ user: employee.name, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      cycle,
      summary: {
        totalEmployees: uniqueEmployees.length,
        assignmentsCreated: assignments.length,
        errors: errors.length,
        breakdown: {
          self: assignments.filter(a => a.type === 'SELF').length,
          manager: assignments.filter(a => a.type === 'MANAGER').length,
          peer: assignments.filter(a => a.type === 'PEER').length,
          subordinate: assignments.filter(a => a.type === 'SUBORDINATE').length
        }
      },
      assignments: assignments.slice(0, 10), // Return first 10 for preview
      errors
    });

  } catch (error) {
    console.error('Error creating goal-based feedback cycle:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback cycle' },
      { status: 500 }
    );
  }
}

// GET - Fetch goal-based feedback cycles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');
    const goalCategory = searchParams.get('goalCategory');

    let whereClause: any = {};

    // Filter by goal if provided
    if (goalId) {
      whereClause.goalId = goalId;
    }

    if (goalCategory) {
      whereClause.goalCategory = goalCategory;
    }

    // Managers can only see cycles for their team's goals
    if (session.user.role === Role.MANAGER) {
      const managerEmployees = await prisma.user.findMany({
        where: { managerId: session.user.id },
        select: { id: true }
      });

      const employeeGoalIds = await prisma.goal.findMany({
        where: { employeeId: { in: managerEmployees.map((emp: any) => emp.id) } },
        select: { id: true }
      });

      whereClause.OR = [
        { goalId: { in: employeeGoalIds.map((g: any) => g.id) } },
        { goalId: null } // General cycles
      ];
    }

    const cycles = await prisma.feedbackCycle.findMany({
      where: whereClause,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        competencies: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        goal: {
          select: {
            id: true,
            title: true,
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            feedbacks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ cycles });

  } catch (error) {
    console.error('Error fetching goal-based feedback cycles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback cycles' },
      { status: 500 }
    );
  }
} 