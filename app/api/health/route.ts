import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const health: {
    status: string;
    timestamp: string;
    checks: {
      database: { status: string; responseTime: number };
    };
  } = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'unknown', responseTime: 0 }
    }
  };

  // Test database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as result`;
    health.checks.database = { status: 'healthy', responseTime: Date.now() - dbStart };
  } catch {
    health.checks.database = { status: 'unhealthy', responseTime: Date.now() - startTime };
  }

  // Overall status (no env vars, no secrets, no config details exposed)
  health.status = health.checks.database.status === 'healthy' ? 'healthy' : 'unhealthy';

  return NextResponse.json(health, { status: health.status === 'healthy' ? 200 : 503 });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
