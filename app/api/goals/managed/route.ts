import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch goals for employees managed by the current manager
    const goals = await prisma.goal.findMany({
      where: {
        AND: [
          {
            OR: [
              // Goals for employees managed by the current manager
              {
                employee: {
                  managerId: session.user.id
                }
              },
              // Personal goals of the manager
              {
                employeeId: session.user.id
              },
              // Goals assigned by the manager
              {
                managerId: session.user.id
              }
            ]
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
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
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
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      goals: goals.map(goal => ({
        ...goal,
        isApprovalProcess: goal.managerId === null,
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
      })),
      stats: {
        total: goals.length,
        completed: goals.filter(goal => goal.status === 'COMPLETED').length,
        pending: goals.filter(goal => goal.status === 'PENDING').length,
        draft: goals.filter(goal => goal.status === 'DRAFT').length,
        categories: goals.reduce((acc: { [key: string]: number }, goal) => {
          acc[goal.category] = (acc[goal.category] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching managed goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch managed goals' },
      { status: 500 }
    );
  }
}