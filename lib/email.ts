import { prisma } from './prisma';

/**
 * Email service for AspireHub notifications.
 * Phase 1: Logs emails to EmailNotification table (no external service yet).
 * Phase 2: Integrate with Resend API for actual sending.
 */

export type EmailTemplate =
  | 'HEART_RECEIVED'
  | 'REVIEW_DUE'
  | 'REVIEW_DELIVERED'
  | 'EVENT_INVITE'
  | 'GOAL_APPROVED'
  | 'GOAL_NEEDS_REVISION';

interface SendEmailParams {
  tenantId: string;
  recipientId: string;
  template: EmailTemplate;
  subject: string;
  body: string;
  scheduledAt?: Date;
}

/**
 * Queue an email notification.
 * Phase 1: Saves to DB (viewable in admin).
 * Phase 2: Sends via Resend API.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    await prisma.emailNotification.create({
      data: {
        tenantId: params.tenantId,
        recipientId: params.recipientId,
        type: params.template,
        subject: params.subject,
        body: params.body,
        scheduledAt: params.scheduledAt || new Date(),
        status: 'PENDING',
      },
    });

    // Phase 2: Actually send via Resend
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ ... });
    // Update status to 'SENT'

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email] Queued: ${params.template} → ${params.recipientId} | ${params.subject}`);
    }
  } catch (error) {
    console.error('[Email] Failed to queue:', error);
  }
}

/**
 * Helper: Send heart received notification
 */
export async function notifyHeartReceived(tenantId: string, receiverId: string, senderName: string, valueName: string, message?: string) {
  await sendEmail({
    tenantId,
    recipientId: receiverId,
    template: 'HEART_RECEIVED',
    subject: `${senderName} recognized you for ${valueName}`,
    body: `${senderName} gave you a Heart for "${valueName}"${message ? `: "${message}"` : ''}`,
  });
}

/**
 * Helper: Send goal status notification
 */
export async function notifyGoalStatus(tenantId: string, recipientId: string, goalTitle: string, status: string, comment?: string) {
  const template = status === 'ACTIVE' ? 'GOAL_APPROVED' : 'GOAL_NEEDS_REVISION';
  const subject = status === 'ACTIVE' ? `Goal approved: ${goalTitle}` : `Goal needs revision: ${goalTitle}`;
  const body = comment ? `${subject}\n\nFeedback: ${comment}` : subject;

  await sendEmail({ tenantId, recipientId, template, subject, body });
}

/**
 * Helper: Send review notification
 */
export async function notifyReviewReady(tenantId: string, recipientId: string, cycleName: string) {
  await sendEmail({
    tenantId,
    recipientId,
    template: 'REVIEW_DELIVERED',
    subject: `Your ${cycleName} review is ready`,
    body: `Your performance review for ${cycleName} has been finalized and is ready to view.`,
  });
}
