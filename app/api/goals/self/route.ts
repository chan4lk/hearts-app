export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Define the status enum since we can't import it directly
const GoalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  MODIFIED: 'MODIFIED',
  DRAFT: 'DRAFT',
  DELETED: 'DELETED'
} as const;

type GoalStatus = typeof GoalStatus[keyof typeof GoalStatus];

interface Rating {
  id: string;
  score: number;
  comments: string | null;
  goalId: string;
  selfRatedById: string;
  managerRatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface GoalWithRelations {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
  employeeId: string;
  managerId: string | null;
  employee: User | null;
  manager: User | null;
  ratings: Rating[];
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
    }) as unknown as GoalWithRelations[];

    return NextResponse.json({ 
      goals,
      stats: {
        total: goals.length,
        rated: goals.filter((g: GoalWithRelations) => g.ratings.length > 0).length,
        unrated: goals.filter((g: GoalWithRelations) => g.ratings.length === 0).length,
        byStatus: {
          PENDING: goals.filter((g: GoalWithRelations) => g.status === GoalStatus.PENDING).length,
          APPROVED: goals.filter((g: GoalWithRelations) => g.status === GoalStatus.APPROVED).length,
          COMPLETED: goals.filter((g: GoalWithRelations) => g.status === GoalStatus.COMPLETED).length,
          REJECTED: goals.filter((g: GoalWithRelations) => g.status === GoalStatus.REJECTED).length,
          MODIFIED: goals.filter((g: GoalWithRelations) => g.status === GoalStatus.MODIFIED).length,
          DRAFT: goals.filter((g: GoalWithRelations) => g.status === GoalStatus.DRAFT).length
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