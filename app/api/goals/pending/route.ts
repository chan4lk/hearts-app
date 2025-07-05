import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { GoalStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user?.role !== 'MANAGER' && session.user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // First get all employees managed by this manager
    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    const employeeIds = employees.map(emp => emp.id);
    console.log('Found employee IDs:', employeeIds); // Debug log

    // Then fetch pending goals for these employees
    const goals = await prisma.goal.findMany({
      where: {
        AND: [
          {
            status: GoalStatus.PENDING,
            employeeId: {
              in: employeeIds,
            }
          },
          {
            NOT: {
              status: 'DELETED'
            }
          }
        ]
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        deletedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found goals:', goals); // Debug log

    // Transform the data to match the frontend interface
    const transformedGoals = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      createdAt: goal.createdAt.toISOString(),
      dueDate: goal.dueDate.toISOString(),
      managerComments: goal.managerComments,
      employee: {
        id: goal.employee.id,
        name: goal.employee.name,
        email: goal.employee.email,
      },
      auditInfo: {
        createdBy: goal.createdBy ? {
          id: goal.createdBy.id,
          name: goal.createdBy.name,
          email: goal.createdBy.email,
          at: goal.createdAt.toISOString()
        } : null,
        updatedBy: goal.updatedBy ? {
          id: goal.updatedBy.id,
          name: goal.updatedBy.name,
          email: goal.updatedBy.email,
          at: goal.updatedAt.toISOString()
        } : null,
        deletedBy: goal.deletedBy ? {
          id: goal.deletedBy.id,
          name: goal.deletedBy.name,
          email: goal.deletedBy.email,
          at: goal.deletedAt?.toISOString() || null
        } : null
      }
    }));

    return NextResponse.json(transformedGoals);
  } catch (error) {
    console.error('Error fetching pending goals:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 