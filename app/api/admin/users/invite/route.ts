import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';

// POST — send login invite to user(s) who haven't logged in yet
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const { userId, userIds } = body;

  const ids = userIds || (userId ? [userId] : []);
  if (ids.length === 0) return NextResponse.json({ error: 'No users specified', code: 'VALIDATION_ERROR' }, { status: 400 });

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
