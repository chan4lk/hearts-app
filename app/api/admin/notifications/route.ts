import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';

// GET — list email notifications (admin only)
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const where: any = { tenantId: ctx.tenantId };
  if (status) where.status = status;

  const [notifications, counts] = await Promise.all([
    prisma.emailNotification.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: limit,
    }),
    prisma.emailNotification.groupBy({
      by: ['status'],
      where: { tenantId: ctx.tenantId },
      _count: { id: true },
    }),
  ]);

  // Get recipient names
  const recipientIds = Array.from(new Set(notifications.map(n => n.recipientId)));
  const users = await prisma.user.findMany({
    where: { id: { in: recipientIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const enriched = notifications.map(n => ({
    ...n,
    recipient: userMap[n.recipientId] || { name: 'Unknown', email: 'unknown' },
  }));

  const stats = {
    total: counts.reduce((sum, c) => sum + c._count.id, 0),
    sent: counts.find(c => c.status === 'SENT')?._count.id || 0,
    pending: counts.find(c => c.status === 'PENDING')?._count.id || 0,
    failed: counts.find(c => c.status === 'FAILED')?._count.id || 0,
  };

  return NextResponse.json({ notifications: enriched, stats });
}
