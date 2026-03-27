import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';

// GET — Hearts analytics (admin only)
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const tenantId = ctx.tenantId;

  // Top recognized employees
  const topReceived = await prisma.heart.groupBy({
    by: ['receiverId'],
    where: { tenantId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const topReceivedWithNames = await Promise.all(
    topReceived.map(async (item) => {
      const user = await prisma.user.findUnique({ where: { id: item.receiverId }, select: { name: true, department: true } });
      return { name: user?.name || 'Unknown', department: user?.department, count: item._count.id };
    })
  );

  // Most active values
  const valueStats = await prisma.heart.groupBy({
    by: ['valueTagId'],
    where: { tenantId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const valuesWithNames = await Promise.all(
    valueStats.map(async (item) => {
      const value = await prisma.companyValue.findUnique({ where: { id: item.valueTagId }, select: { name: true } });
      return { name: value?.name || 'Unknown', count: item._count.id };
    })
  );

  // Hearts trend (last 30 days, grouped by day)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentHearts = await prisma.heart.findMany({
    where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const dailyCounts: Record<string, number> = {};
  recentHearts.forEach(h => {
    const day = h.createdAt.toISOString().split('T')[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });

  const trend = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  // Total stats
  const totalHearts = await prisma.heart.count({ where: { tenantId } });
  const totalThisMonth = await prisma.heart.count({
    where: { tenantId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
  });

  return NextResponse.json({
    topRecognized: topReceivedWithNames,
    valueBreakdown: valuesWithNames,
    trend,
    totalHearts,
    totalThisMonth,
  });
}
