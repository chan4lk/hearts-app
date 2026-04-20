import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';

export async function POST() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const updated = await prisma.notification.updateMany({
    where: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true, markedRead: updated.count });
}
