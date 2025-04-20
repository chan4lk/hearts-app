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

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get active sessions (users who have been active in the last 30 minutes)
    const activeSessions = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      }
    });

    // Get system uptime (this would be calculated based on your actual uptime monitoring)
    const systemUptime = 99.9; // This should come from your monitoring system

    // Get security alerts (users who haven't logged in for 24 hours)
    const securityAlerts = await prisma.user.count({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Get role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Get recent user activity
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

    return NextResponse.json({
      totalUsers,
      activeSessions,
      systemUptime,
      securityAlerts,
      roleDistribution,
      recentUsers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 