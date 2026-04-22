import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { z } from 'zod';

const UpdateValueSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ valueId: string }> }
) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = UpdateValueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { valueId } = await params;

  const value = await prisma.companyValue.findFirst({
    where: { id: valueId, tenantId: ctx.tenantId },
  });
  if (!value) {
    return NextResponse.json({ error: 'Value not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  if (parsed.data.name && parsed.data.name !== value.name) {
    const clash = await prisma.companyValue.findUnique({
      where: { tenantId_name: { tenantId: ctx.tenantId, name: parsed.data.name } },
    });
    if (clash && clash.id !== value.id) {
      return NextResponse.json(
        { error: 'A value with this name already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.companyValue.update({
    where: { id: valueId },
    data: parsed.data,
  });

  let action: string = AuditAction.VALUE_UPDATED;
  if (parsed.data.isActive === true && !value.isActive) action = AuditAction.VALUE_ACTIVATED;
  else if (parsed.data.isActive === false && value.isActive) action = AuditAction.VALUE_DEACTIVATED;

  await logAudit(ctx, {
    action,
    entity: 'CompanyValue',
    entityId: valueId,
    details: {
      before: { name: value.name, isActive: value.isActive },
      after: { name: updated.name, isActive: updated.isActive },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ valueId: string }> }
) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const { valueId } = await params;

  const value = await prisma.companyValue.findFirst({
    where: { id: valueId, tenantId: ctx.tenantId },
    include: { _count: { select: { hearts: true } } },
  });
  if (!value) {
    return NextResponse.json({ error: 'Value not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  if (value._count.hearts > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${value._count.hearts} heart${value._count.hearts === 1 ? '' : 's'} reference this value. Deactivate it instead to preserve history.`,
        code: 'IN_USE',
        heartsCount: value._count.hearts,
      },
      { status: 409 }
    );
  }

  await prisma.companyValue.delete({ where: { id: valueId } });

  await logAudit(ctx, {
    action: AuditAction.VALUE_DELETED,
    entity: 'CompanyValue',
    entityId: valueId,
    details: { name: value.name, wasActive: value.isActive },
  });

  return NextResponse.json({ success: true });
}
