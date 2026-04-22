import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyReviewScheduleDue } from '@/lib/email';
import { logger } from '@/lib/logger';

/**
 * Daily cron: finds employees whose review is due within the next 7 days
 * (or overdue) and hasn't received a reminder in the last 7 days, then
 * emails each one plus their reporting person.
 *
 * Auth: requires `x-cron-secret` header to match CRON_SECRET env var.
 * Schedule: run once per day. Examples:
 *
 *   # Vercel cron (vercel.json)
 *   { "crons": [{ "path": "/api/cron/review-reminders", "schedule": "0 8 * * *" }] }
 *
 *   # Plain Linux cron
 *   0 8 * * *  curl -fsS -H "x-cron-secret: $CRON_SECRET" https://aspirehub.example.com/api/cron/review-reminders
 *
 * Idempotent: the `reviewReminderSentAt` stamp prevents re-sending within
 * the same 7-day window even if the cron fires multiple times.
 */

const REMINDER_WINDOW_DAYS = 7;
const REMINDER_COOLDOWN_DAYS = 7;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.warn('cron.review_reminders.no_secret_configured');
    return NextResponse.json(
      { error: 'CRON_SECRET not configured on server', code: 'SERVER_CONFIG' },
      { status: 500 }
    );
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const cooldownCutoff = new Date(now.getTime() - REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  // Users eligible for a reminder: active, have a nextReviewDate within the
  // window (including overdue), and either never reminded or reminded >7d ago.
  const due = await prisma.user.findMany({
    where: {
      isActive: true,
      nextReviewDate: { lte: windowEnd, not: null },
      OR: [
        { reviewReminderSentAt: null },
        { reviewReminderSentAt: { lt: cooldownCutoff } },
      ],
    },
    include: { manager: { select: { id: true, name: true, email: true } } },
  });

  const results = { processed: 0, employees: 0, managers: 0, errors: 0 };

  for (const user of due) {
    if (!user.nextReviewDate) continue;
    const daysUntil = Math.floor(
      (user.nextReviewDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    const reviewDateStr = user.nextReviewDate.toLocaleDateString();

    const outcomes = await Promise.allSettled([
      notifyReviewScheduleDue({
        tenantId: user.tenantId,
        recipientId: user.id,
        audience: 'employee',
        employeeName: user.name,
        reportingPersonName: user.manager?.name ?? null,
        reviewDate: reviewDateStr,
        daysUntil,
      }),
      user.manager
        ? notifyReviewScheduleDue({
            tenantId: user.tenantId,
            recipientId: user.manager.id,
            audience: 'manager',
            employeeName: user.name,
            reportingPersonName: user.manager.name,
            reviewDate: reviewDateStr,
            daysUntil,
          })
        : Promise.resolve(null),
    ]);

    const [empResult, mgrResult] = outcomes;
    if (empResult.status === 'fulfilled') results.employees++;
    else results.errors++;
    if (mgrResult.status === 'fulfilled' && user.manager) results.managers++;
    else if (mgrResult.status === 'rejected') results.errors++;

    await prisma.user.update({
      where: { id: user.id },
      data: { reviewReminderSentAt: now },
    });
    results.processed++;
  }

  logger.info('cron.review_reminders.completed', results);

  return NextResponse.json({ ok: true, ...results });
}

/**
 * GET is a liveness probe — returns 200 so health checks and the Vercel cron
 * dashboard can confirm the route exists. Does NOT send emails.
 */
export async function GET() {
  return NextResponse.json({ ok: true, info: 'POST with x-cron-secret to trigger reminders.' });
}
