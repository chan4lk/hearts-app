import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { z } from 'zod';

const CleanupSchema = z.object({
  olderThanDays: z.number().int().min(1).max(365).default(90),
});

/**
 * Admin-only: delete read notifications older than N days (default 90).
 * Safe to call from a cron job, e.g. `0 3 * * *` daily at 3am.
 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json().catch(() => ({}));
  const parsed = CleanupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const cutoff = new Date(Date.now() - parsed.data.olderThanDays * 24 * 60 * 60 * 1000);

  const { count } = await prisma.notification.deleteMany({
    where: {
      tenantId: ctx.tenantId,
      readAt: { not: null, lt: cutoff },
    },
  });

  return NextResponse.json({ deleted: count, cutoff: cutoff.toISOString() });
}
