import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const tenantId = ctx.tenantId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [topReceived, valueStats, recentHearts, totalHearts, totalThisMonth] = await Promise.all([
    prisma.heart.groupBy({
      by: ['receiverId'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.heart.groupBy({
      by: ['valueTagId'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.heart.findMany({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.heart.count({ where: { tenantId } }),
    prisma.heart.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
  ]);

  const receiverIds = topReceived.map((t) => t.receiverId);
  const valueIds = valueStats.map((v) => v.valueTagId);

  const [receivers, values] = await Promise.all([
    receiverIds.length
      ? prisma.user.findMany({
          where: { id: { in: receiverIds } },
          select: { id: true, name: true, department: true },
        })
      : Promise.resolve([]),
    valueIds.length
      ? prisma.companyValue.findMany({
          where: { id: { in: valueIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const receiverById = new Map(receivers.map((u) => [u.id, u]));
  const valueById = new Map(values.map((v) => [v.id, v]));

  const topRecognized = topReceived.map((item) => {
    const u = receiverById.get(item.receiverId);
    return { name: u?.name || 'Unknown', department: u?.department ?? null, count: item._count.id };
  });

  const valueBreakdown = valueStats.map((item) => {
    const v = valueById.get(item.valueTagId);
    return { name: v?.name || 'Unknown', count: item._count.id };
  });

  const dailyCounts: Record<string, number> = {};
  for (const h of recentHearts) {
    const day = h.createdAt.toISOString().split('T')[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  }
  const trend = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    topRecognized,
    valueBreakdown,
    trend,
    totalHearts,
    totalThisMonth,
  });
}
