import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const { searchParams } = new URL(req.url);
  const department = searchParams.get('department');
  const role = searchParams.get('role');
  const status = searchParams.get('status');

  const where: any = { tenantId: ctx.tenantId };
  if (department) where.department = department;
  if (role) where.role = role;
  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      position: true,
      jobCategory: true,
      appointmentDate: true,
      reviewMonth: true,
      isActive: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(users);
}
