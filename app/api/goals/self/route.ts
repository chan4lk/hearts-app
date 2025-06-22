export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface Goal {
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'MODIFIED';
  ratings: any[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all goals where the user is either:
    // 1. The employee (assigned goals)
    // 2. Both employee and manager (self-created goals)
    const goals = await prisma.goal.findMany({
      where: {
        employeeId: session.user.id,
        status: { not: 'DELETED' }
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
        ratings: {
          where: {
            OR: [
              { selfRatedById: session.user.id },
              { managerRatedById: session.user.id }
            ]
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      goals,
      stats: {
        total: goals.length,
        rated: goals.filter((g: Goal) => g.ratings.length > 0).length,
        unrated: goals.filter((g: Goal) => g.ratings.length === 0).length,
        byStatus: {
          PENDING: goals.filter((g: Goal) => g.status === 'PENDING').length,
          APPROVED: goals.filter((g: Goal) => g.status === 'APPROVED').length,
          COMPLETED: goals.filter((g: Goal) => g.status === 'COMPLETED').length,
          REJECTED: goals.filter((g: Goal) => g.status === 'REJECTED').length,
          MODIFIED: goals.filter((g: Goal) => g.status === 'MODIFIED').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching self-created goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
} 