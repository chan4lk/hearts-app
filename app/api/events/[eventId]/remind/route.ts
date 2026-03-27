import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';

// POST — send reminder to non-respondents (admin only)
export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, tenantId: ctx.tenantId },
    include: {
      participations: {
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!event) return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });

  let sentCount = 0;
  for (const p of event.participations) {
    await sendEmail({
      tenantId: ctx.tenantId,
      recipientId: p.userId,
      template: 'EVENT_INVITE',
      subject: `Reminder: ${event.title} — Please RSVP`,
      body: `You haven't responded to "${event.title}" on ${new Date(event.dateTime).toLocaleDateString()}. Please confirm or decline your attendance.`,
    });
    sentCount++;
  }

  return NextResponse.json({ message: `Reminders sent to ${sentCount} people` });
}
