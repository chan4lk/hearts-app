export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent user activities
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Get recent goal activities
    const recentGoals = await prisma.goal.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        employee: {
          select: {
            name: true
          }
        }
      }
    });

    // Format activities
    const activities = [
      ...recentUsers.map(user => ({
        type: 'User Activity',
        description: `${user.name} (${user.role}) was active`,
        timestamp: user.updatedAt.toISOString(),
        status: 'success' as const
      })),
      ...recentGoals.map(goal => ({
        type: 'Goal Update',
        description: `Goal "${goal.title}" was updated by ${goal.employee.name}`,
        timestamp: goal.updatedAt.toISOString(),
        status: goal.status === 'APPROVED' ? 'success' : 
                goal.status === 'REJECTED' ? 'error' : 
                'warning' as const
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 10); // Get only the 10 most recent activities

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 