import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: 'ok',
        db: 'up',
        uptimeSec: Math.round(process.uptime()),
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[health] db check failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'down',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
