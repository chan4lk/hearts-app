import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';

// PATCH — update/deactivate template (admin only)
export async function PATCH(req: NextRequest, { params }: { params: { templateId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const template = await prisma.goalTemplate.findFirst({ where: { id: params.templateId, tenantId: ctx.tenantId } });
  if (!template) return NextResponse.json({ error: 'Template not found', code: 'NOT_FOUND' }, { status: 404 });

  const updated = await prisma.goalTemplate.update({
    where: { id: params.templateId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json(updated);
}
