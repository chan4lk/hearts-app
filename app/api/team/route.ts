import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { hasMinRole, requireMinRole } from '@/lib/rbac';

/**
 * GET /api/team — list team members scoped by caller's role.
 *
 *   Default (no scope):
 *     MANAGER → their direct reports (users with managerId = ctx.userId)
 *     ADMIN   → all active employees in the tenant
 *
 *   scope=all (ADMIN-only):
 *     ADMIN   → every active user in the tenant (including admins / managers)
 *     MANAGER → 403
 *
 *   scope=employees (MANAGER+ADMIN):
 *     Anyone with role=EMPLOYEE (ADMIN sees all of them; MANAGER sees only theirs)
 *
 * Returns user rows compatible with the /dashboard/team and
 * /dashboard/admin/team card list.
 */
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'MANAGER');

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') || 'own';

  if (scope === 'all' && !hasMinRole(ctx, 'ADMIN')) {
    return NextResponse.json({ error: 'Only admins can view all users', code: 'FORBIDDEN' }, { status: 403 });
  }

  const where: any = { tenantId: ctx.tenantId, isActive: true };

  if (scope === 'own') {
    // Everyone (including admin) sees only their direct reports.
    // Admin who wants to assign to others must first become that user's
    // manager via /dashboard/admin/users — explicit, audited intervention.
    where.managerId = ctx.userId;
  } else if (scope === 'employees') {
    where.role = 'EMPLOYEE';
    if (!hasMinRole(ctx, 'ADMIN')) {
      where.managerId = ctx.userId;
    }
  }
  // scope === 'all' → no extra filter beyond tenant+active (admin-gated above)

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      position: true,
      isActive: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(users);
}
