import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';

// GET — Hearts profile for a user
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { userId } = params;

  // Get hearts received with value breakdown
  const heartsReceived = await prisma.heart.findMany({
    where: { tenantId: ctx.tenantId, receiverId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      sender: { select: { id: true, name: true } },
      valueTag: { select: { id: true, name: true } },
    },
  });

  // Get hearts given
  const heartsGiven = await prisma.heart.findMany({
    where: { tenantId: ctx.tenantId, senderId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      receiver: { select: { id: true, name: true } },
      valueTag: { select: { id: true, name: true } },
    },
  });

  // Value tag breakdown
  const valueBreakdown: Record<string, number> = {};
  heartsReceived.forEach((h) => {
    valueBreakdown[h.valueTag.name] = (valueBreakdown[h.valueTag.name] || 0) + 1;
  });

  return NextResponse.json({
    totalReceived: heartsReceived.length,
    totalGiven: heartsGiven.length,
    valueBreakdown,
    recentReceived: heartsReceived.slice(0, 10),
    recentGiven: heartsGiven.slice(0, 10),
  });
}
