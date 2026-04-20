import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const unread = await prisma.notification.count({
    where: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      readAt: null,
    },
  });

  return NextResponse.json({ unread });
}
