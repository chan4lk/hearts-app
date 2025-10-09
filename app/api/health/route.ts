import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const health = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: 'unknown',
        message: '',
        responseTime: 0
      },
      environment: {
        status: 'unknown',
        variables: {
          AZURE_AD_CLIENT_ID: !!process.env.AZURE_AD_CLIENT_ID,
          AZURE_AD_CLIENT_SECRET: !!process.env.AZURE_AD_CLIENT_SECRET,
          AZURE_AD_TENANT_ID: !!process.env.AZURE_AD_TENANT_ID,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
          NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          DATABASE_URL: !!process.env.DATABASE_URL,
          NODE_ENV: process.env.NODE_ENV || 'not set'
        }
      }
    }
  };

  // Test database connection
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as result`;
    const dbEndTime = Date.now();
    
    health.checks.database.status = 'healthy';
    health.checks.database.message = 'Database connection successful';
    health.checks.database.responseTime = dbEndTime - dbStartTime;
  } catch (error) {
    health.checks.database.status = 'unhealthy';
    health.checks.database.message = error instanceof Error ? error.message : 'Unknown database error';
    health.checks.database.responseTime = Date.now() - startTime;
  }

  // Check environment variables
  const requiredVars = [
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET', 
    'AZURE_AD_TENANT_ID',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DATABASE_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    health.checks.environment.status = 'healthy';
  } else {
    health.checks.environment.status = 'unhealthy';
    health.checks.environment['missingVariables'] = missingVars;
  }

  // Overall status
  if (
    health.checks.database.status === 'healthy' && 
    health.checks.environment.status === 'healthy'
  ) {
    health.status = 'healthy';
  } else {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

