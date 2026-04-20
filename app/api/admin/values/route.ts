import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { sanitizeInput } from '@/lib/securityUtils';
import { z } from 'zod';

// GET — list all company values (all authenticated users can read)
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const values = await prisma.companyValue.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { hearts: true } } },
  });

  return NextResponse.json(values);
}

const CreateValueSchema = z.object({
  name: z.string().min(1).max(50).transform(sanitizeInput)
    .refine((s) => s.length > 0, 'Name cannot be empty'),
});

// POST — create company value (admin only)
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = CreateValueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  // Check for duplicate name within tenant
  const existing = await prisma.companyValue.findUnique({
    where: { tenantId_name: { tenantId: ctx.tenantId, name: parsed.data.name } },
  });
  if (existing) {
    return NextResponse.json({ error: 'A value with this name already exists', code: 'CONFLICT' }, { status: 409 });
  }

  const value = await prisma.companyValue.create({
    data: {
      tenantId: ctx.tenantId,
      name: parsed.data.name,
      isActive: true,
    },
  });

  await logAudit(ctx, {
    action: AuditAction.VALUE_CREATED,
    entity: 'CompanyValue',
    entityId: value.id,
    details: { name: value.name },
  });

  return NextResponse.json(value, { status: 201 });
}
