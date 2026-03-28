import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { z } from 'zod';

// GET — list goal templates (all users can read)
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const templates = await prisma.goalTemplate.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    orderBy: { title: 'asc' },
  });

  return NextResponse.json(templates);
}

const CreateTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
});

// POST — create goal template (admin only)
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 });

  const existing = await prisma.goalTemplate.findUnique({
    where: { tenantId_title: { tenantId: ctx.tenantId, title: parsed.data.title } },
  });
  if (existing) return NextResponse.json({ error: 'Template with this title already exists', code: 'CONFLICT' }, { status: 409 });

  const template = await prisma.goalTemplate.create({
    data: { tenantId: ctx.tenantId, ...parsed.data },
  });

  return NextResponse.json(template, { status: 201 });
}
