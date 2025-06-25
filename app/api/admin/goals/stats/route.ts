import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type GoalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'COMPLETED' | 'DRAFT' | 'DELETED';
type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

interface Goal {
  id: string;
  title: string;
  status: GoalStatus;
  updatedAt: Date;
  employee: {
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  role: Role;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all goals
    const goals = await prisma.goal.findMany({
      where: {
        status: {
          not: 'DELETED'
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Calculate statistics
    const stats = {
      total: goals.length,
      completed: goals.filter((g: Goal) => g.status === 'COMPLETED').length,
      pending: goals.filter((g: Goal) => g.status === 'PENDING').length,
      inProgress: goals.filter((g: Goal) => g.status === 'APPROVED').length,
      draft: goals.filter((g: Goal) => g.status === 'DRAFT').length,
      rejected: goals.filter((g: Goal) => g.status === 'REJECTED').length,
      modified: goals.filter((g: Goal) => g.status === 'MODIFIED').length
    };

    // Get user counts
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['EMPLOYEE', 'MANAGER']
        }
      }
    });

    const userStats = {
      totalEmployees: users.filter((u: User) => u.role === 'EMPLOYEE').length,
      totalManagers: users.filter((u: User) => u.role === 'MANAGER').length
    };

    // Get recent activity
    const recentActivity = await prisma.goal.findMany({
      where: {
        status: {
          not: 'DELETED'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5,
      include: {
        employee: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      stats,
      userStats,
      recentActivity: recentActivity.map((goal: Goal) => ({
        id: goal.id,
        type: goal.status,
        description: `Goal "${goal.title}" was ${goal.status.toLowerCase()}`,
        timestamp: goal.updatedAt.toISOString(),
        employee: goal.employee
      }))
    });

  } catch (error) {
    console.error('Error fetching admin goal statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal statistics' },
      { status: 500 }
    );
  }
} 