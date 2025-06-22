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

    // Get recent goal activities, including deleted goals
    const recentGoals = await prisma.goal.findMany({
      take: 10, // Increased take to get more goal activities
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
        description: `${user.name} (${user.role}) was Active`,
        timestamp: user.updatedAt.toISOString(),
        status: 'success' as const
      })),
      ...recentGoals.map(goal => {
        let description = `Goal "${goal.title}" was Updated by ${goal.employee.name}`;
        if (goal.status === 'DELETED') {
          description = `Goal "${goal.title}" was Deleted`;
        } else if (goal.status === 'COMPLETED') {
          description = `Goal "${goal.title}" was Completed by ${goal.employee.name}`;
        } else if (goal.status === 'APPROVED') {
          description = `Goal "${goal.title}" was Approved`;
        } else if (goal.status === 'REJECTED') {
          description = `Goal "${goal.title}" was Rejected`;
        }

        return {
          type: `Goal ${goal.status.toLowerCase()}`,
          description,
          timestamp: goal.updatedAt.toISOString(),
          status: goal.status === 'APPROVED' || goal.status === 'COMPLETED' ? 'success' : 
                  goal.status === 'REJECTED' || goal.status === 'DELETED' ? 'error' : 
                  'warning' as const
        };
      })
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 15); // Get only the 15 most recent activities

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error Fetching Admin Activities:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 