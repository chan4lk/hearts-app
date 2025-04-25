import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        employee: {
          managerId: session.user.id
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      goals,
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