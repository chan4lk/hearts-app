import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { hasMinRole, requireMinRole } from '@/lib/rbac';
import { AuditAction, logAudit } from '@/lib/auditLog';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true';
  const showAll = includeInactive && hasMinRole(ctx, 'ADMIN');

  const templates = await prisma.goalTemplate.findMany({
    where: {
      tenantId: ctx.tenantId,
      ...(showAll ? {} : { isActive: true }),
    },
    orderBy: [{ isActive: 'desc' }, { title: 'asc' }],
  });

  return NextResponse.json(templates);
}

const CreateTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const existing = await prisma.goalTemplate.findUnique({
    where: { tenantId_title: { tenantId: ctx.tenantId, title: parsed.data.title } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'A template with this title already exists', code: 'CONFLICT' },
      { status: 409 }
    );
  }

  const template = await prisma.goalTemplate.create({
    data: { tenantId: ctx.tenantId, ...parsed.data },
  });

  await logAudit(ctx, {
    action: AuditAction.TEMPLATE_CREATED,
    entity: 'GoalTemplate',
    entityId: template.id,
    details: { title: template.title, category: template.category },
  });

  return NextResponse.json(template, { status: 201 });
}
