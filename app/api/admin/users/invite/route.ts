import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rateLimit';

const MAX_INVITES_PER_REQUEST = 100;

// POST — send login invite to user(s) who haven't logged in yet
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const limited = checkRateLimit(`admin:invite:${ctx.userId}`, 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await req.json();
  const { userId, userIds } = body;

  const ids: string[] = Array.isArray(userIds) ? userIds : (userId ? [userId] : []);
  if (ids.length === 0) return NextResponse.json({ error: 'No users specified', code: 'VALIDATION_ERROR' }, { status: 400 });
  if (ids.length > MAX_INVITES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Cannot invite more than ${MAX_INVITES_PER_REQUEST} users per request`, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  let sent = 0;
  for (const id of ids) {
    await sendEmail({
      tenantId: ctx.tenantId,
      recipientId: id,
      template: 'EVENT_INVITE',
      subject: 'You\'re invited to join AspireHub!',
      body: `Your organization uses AspireHub for performance management, peer recognition, and goal tracking.\n\nSign in with your Microsoft account to get started. Your account is ready and waiting for you!\n\nWhat you can do:\n• Give Hearts to recognize colleagues\n• Set and track your goals\n• Participate in performance reviews\n• Join company events`,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
