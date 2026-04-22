import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit } from '@/lib/auditLog';
import { notifyReviewScheduleDue } from '@/lib/email';
import { logger } from '@/lib/logger';

/**
 * Manually send a review-due reminder for a specific user. Emails the
 * employee and their reporting person (if any), stamps
 * `reviewReminderSentAt`, and logs an audit entry.
 *
 * Admin-only. The automatic cron route shares the same emitter via
 * notifyReviewScheduleDue().
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const { userId } = await params;

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: ctx.tenantId },
    include: { manager: { select: { id: true, name: true, email: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  // Need a review date — either the stored one or a computed fallback.
  let reviewDate: Date | null = user.nextReviewDate ?? null;
  if (!reviewDate && user.appointmentDate) {
    reviewDate = new Date(user.appointmentDate);
    reviewDate.setMonth(reviewDate.getMonth() + 6);
  }
  if (!reviewDate) {
    return NextResponse.json(
      { error: 'User has no review date set. Adjust the date first.', code: 'CONFLICT' },
      { status: 409 }
    );
  }

  const daysUntil = Math.floor((reviewDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const reviewDateStr = reviewDate.toLocaleDateString();

  // Fire the two emails in parallel. Failures on one shouldn't block the other.
  await Promise.allSettled([
    notifyReviewScheduleDue({
      tenantId: ctx.tenantId,
      recipientId: user.id,
      audience: 'employee',
      employeeName: user.name,
      reportingPersonName: user.manager?.name ?? null,
      reviewDate: reviewDateStr,
      daysUntil,
    }),
    user.manager
      ? notifyReviewScheduleDue({
          tenantId: ctx.tenantId,
          recipientId: user.manager.id,
          audience: 'manager',
          employeeName: user.name,
          reportingPersonName: user.manager.name,
          reviewDate: reviewDateStr,
          daysUntil,
        })
      : Promise.resolve(),
  ]);

  await prisma.user.update({
    where: { id: user.id },
    data: { reviewReminderSentAt: new Date() },
  });

  await logAudit(ctx, {
    action: 'REVIEW_REMINDER_SENT',
    entity: 'User',
    entityId: user.id,
    details: { reviewDate: reviewDateStr, daysUntil, managerNotified: !!user.manager },
  });

  logger.info('review.reminder.sent', {
    userId: user.id,
    managerId: user.manager?.id ?? null,
    daysUntil,
  });

  return NextResponse.json({ success: true, managerNotified: !!user.manager });
}
