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

// PATCH — update company value (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { valueId: string } }
) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = UpdateValueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const { valueId } = params;

  // Verify value belongs to tenant
  const value = await prisma.companyValue.findFirst({
    where: { id: valueId, tenantId: ctx.tenantId },
  });
  if (!value) {
    return NextResponse.json({ error: 'Value not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const updated = await prisma.companyValue.update({
    where: { id: valueId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
  });

  if (parsed.data.isActive === false) {
    await logAudit(ctx, {
      action: AuditAction.VALUE_DEACTIVATED,
      entity: 'CompanyValue',
      entityId: valueId,
      details: { name: value.name },
    });
  }

  return NextResponse.json(updated);
}
