import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const users = await prisma.user.findMany({
    where: {
      tenantId: ctx.tenantId,
      isActive: true,
      NOT: { id: ctx.userId },
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(users);
}
