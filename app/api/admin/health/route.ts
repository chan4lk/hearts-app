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

    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Check API health
    const apiHealth = await checkApiHealth();
    
    // Check cache health (simplified)
    const cacheHealth = await checkCacheHealth();
    
    // Check storage health (simplified)
    const storageHealth = await checkStorageHealth();

    return NextResponse.json([
      {
        component: 'Database',
        status: dbHealth.status,
        percentage: dbHealth.percentage
      },
      {
        component: 'API Server',
        status: apiHealth.status,
        percentage: apiHealth.percentage
      },
      {
        component: 'Cache Server',
        status: cacheHealth.status,
        percentage: cacheHealth.percentage
      },
      {
        component: 'File Storage',
        status: storageHealth.status,
        percentage: storageHealth.percentage
      }
    ]);
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkDatabaseHealth() {
  try {
    // Check if we can query the database
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'operational' as const,
      percentage: 100
    };
  } catch (error) {
    return {
      status: 'down' as const,
      percentage: 0
    };
  }
}

async function checkApiHealth() {
  try {
    // Check if the API is responding
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      return {
        status: 'operational' as const,
        percentage: 100
      };
    }
    return {
      status: 'degraded' as const,
      percentage: 50
    };
  } catch (error) {
    return {
      status: 'down' as const,
      percentage: 0
    };
  }
}

async function checkCacheHealth() {
  // This is a simplified version - in production you'd want to check your actual cache server
  return {
    status: 'operational' as const,
    percentage: 100
  };
}

async function checkStorageHealth() {
  // This is a simplified version - in production you'd want to check your actual storage system
  return {
    status: 'operational' as const,
    percentage: 100
  };
} 