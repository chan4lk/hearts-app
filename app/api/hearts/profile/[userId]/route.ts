import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { userId } = params;

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: ctx.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      position: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });

  const [
    totalReceived,
    totalGiven,
    recentReceived,
    recentGiven,
    valueGroups,
    topSenders,
  ] = await Promise.all([
    prisma.heart.count({ where: { tenantId: ctx.tenantId, receiverId: userId } }),
    prisma.heart.count({ where: { tenantId: ctx.tenantId, senderId: userId } }),
    prisma.heart.findMany({
      where: { tenantId: ctx.tenantId, receiverId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sender: { select: { id: true, name: true, department: true } },
        valueTag: { select: { id: true, name: true } },
      },
    }),
    prisma.heart.findMany({
      where: { tenantId: ctx.tenantId, senderId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        receiver: { select: { id: true, name: true, department: true } },
        valueTag: { select: { id: true, name: true } },
      },
    }),
    prisma.heart.groupBy({
      by: ['valueTagId'],
      where: { tenantId: ctx.tenantId, receiverId: userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.heart.groupBy({
      by: ['senderId'],
      where: { tenantId: ctx.tenantId, receiverId: userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const valueIds = valueGroups.map((v) => v.valueTagId);
  const senderIds = topSenders.map((s) => s.senderId);
  const [values, senders] = await Promise.all([
    valueIds.length
      ? prisma.companyValue.findMany({
          where: { id: { in: valueIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    senderIds.length
      ? prisma.user.findMany({
          where: { id: { in: senderIds } },
          select: { id: true, name: true, department: true },
        })
      : Promise.resolve([]),
  ]);

  const valueById = new Map(values.map((v) => [v.id, v.name]));
  const senderById = new Map(senders.map((s) => [s.id, s]));

  const valueBreakdown: Record<string, number> = {};
  for (const g of valueGroups) {
    valueBreakdown[valueById.get(g.valueTagId) || 'Unknown'] = g._count.id;
  }

  const topSendersWithNames = topSenders
    .map((s) => {
      const u = senderById.get(s.senderId);
      return u ? { id: u.id, name: u.name, department: u.department, count: s._count.id } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  return NextResponse.json({
    user,
    totalReceived,
    totalGiven,
    valueBreakdown,
    topSenders: topSendersWithNames,
    recentReceived,
    recentGiven,
  });
}
