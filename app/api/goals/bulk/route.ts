import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { hasMinRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { z } from 'zod';

const BulkGoalItem = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  targetDate: z.string().optional(),
});

const BulkCreateSchema = z.object({
  goals: z.array(BulkGoalItem).min(1).max(20),
  // For manager bulk assign: assign same goals to multiple employees
  assignToUserIds: z.array(z.string()).optional(),
});

// POST — bulk create goals
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const limited = checkRateLimit(`goals:bulk:${ctx.userId}`, 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await req.json();
  const parsed = BulkCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });

  const { goals, assignToUserIds } = parsed.data;
  const isManagerAssign = assignToUserIds && assignToUserIds.length > 0;

  // Manager bulk assign: verify role and employees exist
  if (isManagerAssign) {
    if (!hasMinRole(ctx, 'MANAGER')) {
      return NextResponse.json({ error: 'Only managers can bulk assign goals', code: 'FORBIDDEN' }, { status: 403 });
    }
    // Verify all target users exist in tenant
    const users = await prisma.user.findMany({
      where: { id: { in: assignToUserIds }, tenantId: ctx.tenantId, isActive: true },
      select: { id: true },
    });
    if (users.length !== assignToUserIds.length) {
      return NextResponse.json({ error: 'Some employees not found', code: 'NOT_FOUND' }, { status: 404 });
    }
  }

  const rows = isManagerAssign
    ? goals.flatMap((goal) =>
        assignToUserIds!.map((userId) => ({
          tenantId: ctx.tenantId,
          title: goal.title,
          description: goal.description || null,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
          status: 'PENDING' as const,
          ownerId: userId,
          assignerId: ctx.userId,
        }))
      )
    : goals.map((goal) => ({
        tenantId: ctx.tenantId,
        title: goal.title,
        description: goal.description || null,
        targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
        status: 'DRAFT' as const,
        ownerId: ctx.userId,
      }));

  const { count } = await prisma.goal.createMany({ data: rows });

  await logAudit(ctx, {
    action: isManagerAssign ? AuditAction.GOAL_ASSIGNED : AuditAction.GOAL_CREATED,
    entity: 'Goal',
    entityId: 'bulk',
    details: isManagerAssign
      ? { goalCount: goals.length, employeeCount: assignToUserIds!.length, totalCreated: count }
      : { goalCount: count },
  });

  return NextResponse.json({ created: count }, { status: 201 });
}
