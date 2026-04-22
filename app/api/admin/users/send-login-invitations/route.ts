import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';
import { logAudit } from '@/lib/auditLog';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * Bulk "Send login invitation" for users who have an active account but
 * have never logged in (`lastLoginAt IS NULL`). Admin picks which users
 * to invite (by id) or sends to all eligible.
 *
 * Admin-only. Returns { sent, skipped, errors }.
 */

const BodySchema = z.object({
  // Explicit list of user IDs. Pass `all: true` to target every eligible
  // user in the tenant that has never logged in.
  userIds: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  const { userIds, all } = parsed.data;
  if (!all && (!userIds || userIds.length === 0)) {
    return NextResponse.json({ error: 'Provide userIds or all:true', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const where: any = {
    tenantId: ctx.tenantId,
    isActive: true,
    lastLoginAt: null,
  };
  if (!all && userIds) where.id = { in: userIds };

  const targets = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true },
  });

  const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  for (const u of targets) {
    try {
      await sendEmail({
        tenantId: ctx.tenantId,
        recipientId: u.id,
        template: 'EVENT_INVITE', // reuse existing template channel; copy is distinct
        subject: `Welcome to AspireHub — sign in to get started`,
        body: [
          `Hi ${u.name.split(' ')[0]},`,
          ``,
          `Your AspireHub account has been created. AspireHub is where your team recognizes great work, tracks goals, and completes performance reviews.`,
          ``,
          `Sign in with your work email at ${loginUrl}/login.`,
          ``,
          `If this is your first time, you'll be prompted to set up your profile. Your role is ${u.role.toLowerCase()}.`,
          ``,
          `— AspireHub`,
        ].join('\n'),
      });
      results.sent++;
    } catch (err) {
      results.skipped++;
      results.errors.push(`${u.email}: ${err instanceof Error ? err.message : 'send failed'}`);
    }
  }

  await logAudit(ctx, {
    action: 'LOGIN_INVITATIONS_SENT',
    entity: 'User',
    entityId: 'bulk',
    details: { sent: results.sent, skipped: results.skipped, scope: all ? 'all_never_logged_in' : 'selected' },
  });

  logger.info('admin.users.login_invitations_sent', {
    sent: results.sent,
    skipped: results.skipped,
    tenantId: ctx.tenantId,
  });

  return NextResponse.json(results);
}
