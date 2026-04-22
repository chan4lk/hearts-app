import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { AuditAction, logAudit } from '@/lib/auditLog';
import { z } from 'zod';

const UpdateTemplateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = UpdateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const template = await prisma.goalTemplate.findFirst({
    where: { id: (await params).templateId, tenantId: ctx.tenantId },
  });
  if (!template) {
    return NextResponse.json({ error: 'Template not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  if (parsed.data.title && parsed.data.title !== template.title) {
    const clash = await prisma.goalTemplate.findUnique({
      where: { tenantId_title: { tenantId: ctx.tenantId, title: parsed.data.title } },
    });
    if (clash && clash.id !== template.id) {
      return NextResponse.json(
        { error: 'A template with this title already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.goalTemplate.update({
    where: { id: (await params).templateId },
    data: parsed.data,
  });

  let action: string = AuditAction.TEMPLATE_UPDATED;
  if (parsed.data.isActive === true && !template.isActive) action = AuditAction.TEMPLATE_ACTIVATED;
  else if (parsed.data.isActive === false && template.isActive) action = AuditAction.TEMPLATE_DEACTIVATED;

  await logAudit(ctx, {
    action,
    entity: 'GoalTemplate',
    entityId: updated.id,
    details: {
      before: { title: template.title, category: template.category, isActive: template.isActive },
      after: { title: updated.title, category: updated.category, isActive: updated.isActive },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const template = await prisma.goalTemplate.findFirst({
    where: { id: (await params).templateId, tenantId: ctx.tenantId },
  });
  if (!template) {
    return NextResponse.json({ error: 'Template not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  await prisma.goalTemplate.delete({ where: { id: template.id } });

  await logAudit(ctx, {
    action: AuditAction.TEMPLATE_DELETED,
    entity: 'GoalTemplate',
    entityId: template.id,
    details: { title: template.title, category: template.category, wasActive: template.isActive },
  });

  return NextResponse.json({ success: true });
}
