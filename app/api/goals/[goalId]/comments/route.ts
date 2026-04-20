import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { sanitizeInputPreserveNewlines } from '@/lib/securityUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

// GET — list comments for a goal
export async function GET(req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const comments = await prisma.goalComment.findMany({
    where: { tenantId: ctx.tenantId, goalId: params.goalId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(comments);
}

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(1000).transform(sanitizeInputPreserveNewlines)
    .refine((s) => s.length > 0, 'Comment cannot be empty after sanitization'),
});

// POST — add comment to goal
export async function POST(req: NextRequest, { params }: { params: { goalId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const limited = checkRateLimit(`comment:${ctx.userId}`, 50, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await req.json();
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  // Verify goal exists in tenant
  const goal = await prisma.goal.findFirst({ where: { id: params.goalId, tenantId: ctx.tenantId } });
  if (!goal) return NextResponse.json({ error: 'Goal not found', code: 'NOT_FOUND' }, { status: 404 });

  const comment = await prisma.goalComment.create({
    data: {
      tenantId: ctx.tenantId,
      goalId: params.goalId,
      authorId: ctx.userId,
      content: parsed.data.content,
      type: 'COMMENT',
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
