import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ notificationId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const updated = await prisma.notification.updateMany({
    where: {
      id: (await params).notificationId,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  if (updated.count === 0) {
    return NextResponse.json({ success: true, alreadyRead: true });
  }

  return NextResponse.json({ success: true });
}
