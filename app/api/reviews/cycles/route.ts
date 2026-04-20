import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { z } from 'zod';

// GET — list review cycles
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const cycles = await prisma.reviewCycle.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { reviews: true } } },
  });

  return NextResponse.json(cycles);
}

const CreateCycleSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.string(),
  endDate: z.string(),
  type: z.enum(['QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']),
});

// POST — create review cycle + auto-generate review pairs (admin only)
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const limited = checkRateLimit(`cycles:create:${ctx.userId}`, 5, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await req.json();
  const parsed = CreateCycleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, startDate, endDate, type } = parsed.data;

  // Create cycle
  const cycle = await prisma.reviewCycle.create({
    data: {
      tenantId: ctx.tenantId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      status: 'ACTIVE',
    },
  });

  // Auto-generate review pairs for all active employees with managers
  const employees = await prisma.user.findMany({
    where: {
      tenantId: ctx.tenantId,
      isActive: true,
      managerId: { not: null },
      role: { not: 'ADMIN' },
    },
    select: { id: true, managerId: true },
  });

  if (employees.length > 0) {
    await prisma.review.createMany({
      data: employees.map((emp) => ({
        tenantId: ctx.tenantId,
        reviewCycleId: cycle.id,
        employeeId: emp.id,
        managerId: emp.managerId!,
      })),
    });
  }

  await logAudit(ctx, {
    action: AuditAction.REVIEW_CYCLE_CREATED,
    entity: 'ReviewCycle',
    entityId: cycle.id,
    details: { name, reviewsGenerated: employees.length },
  });

  return NextResponse.json({ ...cycle, reviewsGenerated: employees.length }, { status: 201 });
}
