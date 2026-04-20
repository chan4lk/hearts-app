import { Resend } from 'resend';
import { EmailClient } from '@azure/communication-email';
import { prisma } from './prisma';
import { logger } from './logger';

/**
 * Email service for AspireHub notifications.
 *
 * Supports 3 providers:
 *
 * ── Option A: Azure Communication Services (recommended for BISTEC) ──
 *   1. Create Communication Service in Azure Portal
 *   2. Enable Email → add domain
 *   3. Add to .env:
 *      EMAIL_PROVIDER=azure
 *      AZURE_COMM_CONNECTION_STRING=endpoint=https://xxx.communication.azure.com/;accesskey=xxx
 *      EMAIL_FROM=DoNotReply@xxxxxxxx.azurecomm.net
 *
 * ── Option B: Resend ──
 *   1. Create account at https://resend.com
 *   2. Add to .env:
 *      EMAIL_PROVIDER=resend
 *      RESEND_API_KEY=re_xxxxx
 *      EMAIL_FROM=noreply@yourdomain.com
 *
 * ── Option C: No provider (default) ──
 *   - Emails save to DB only (viewable in Admin → Emails)
 *   - Set EMAIL_MODE=log to also print to console
 */

// Provider setup
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'none'; // 'azure' | 'resend' | 'none'
const EMAIL_FROM = process.env.EMAIL_FROM || 'AspireHub <onboarding@resend.dev>';
const EMAIL_MODE = process.env.EMAIL_MODE || 'send'; // 'send' | 'log' | 'off'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Initialize providers lazily
const resend = EMAIL_PROVIDER === 'resend' && process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY) : null;

const azureEmailClient = EMAIL_PROVIDER === 'azure' && process.env.AZURE_COMM_CONNECTION_STRING
  ? new EmailClient(process.env.AZURE_COMM_CONNECTION_STRING) : null;

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
  entityType?: 'GOAL' | 'REVIEW' | 'HEART' | 'EVENT';
  entityId?: string;
}

/**
 * Send an email notification.
 * - If RESEND_API_KEY is set → sends via Resend + logs to DB
 * - If not set → logs to DB only (viewable in admin notifications page)
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    // Get recipient email
    const recipient = await prisma.user.findUnique({
      where: { id: params.recipientId },
      select: { email: true, name: true },
    });

    if (!recipient) {
      console.error(`[Email] Recipient not found: ${params.recipientId}`);
      return;
    }

    // Save to DB (always — serves as email delivery log)
    const notification = await prisma.emailNotification.create({
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

    // Create in-app notification row (unread by default)
    await prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.recipientId,
        type: params.template,
        title: params.subject,
        message: params.body.slice(0, 500),
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
      },
    }).catch((e) => console.error('[Notification] Failed to create in-app:', e));

    // Build HTML for sending
    const html = buildEmailHtml({
      recipientName: recipient.name || 'Team Member',
      subject: params.subject,
      body: params.body,
      template: params.template,
    });

    // Send via configured provider
    if (EMAIL_MODE === 'send' && (resend || azureEmailClient)) {
      try {
        let sendError: any = null;

        if (azureEmailClient) {
          // ── Azure Communication Services ──
          const poller = await azureEmailClient.beginSend({
            senderAddress: EMAIL_FROM,
            content: { subject: params.subject, html },
            recipients: { to: [{ address: recipient.email, displayName: recipient.name || undefined }] },
          });
          const result = await poller.pollUntilDone();
          if (result.status !== 'Succeeded') {
            sendError = { message: `Azure email status: ${result.status}`, code: result.error?.code };
          }
        } else if (resend) {
          // ── Resend ──
          const result = await resend.emails.send({
            from: EMAIL_FROM,
            to: recipient.email,
            subject: params.subject,
            html,
          });
          sendError = result.error;
        }

        if (sendError) {
          console.error(`[Email] ${EMAIL_PROVIDER} error:`, sendError);
          await prisma.emailNotification.update({
            where: { id: notification.id },
            data: { status: 'FAILED' },
          });
        } else {
          await prisma.emailNotification.update({
            where: { id: notification.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        }
      } catch (sendErr) {
        console.error(`[Email] ${EMAIL_PROVIDER} send failed:`, sendErr);
        await prisma.emailNotification.update({
          where: { id: notification.id },
          data: { status: 'FAILED' },
        });
      }
    } else if (EMAIL_MODE === 'log') {
      console.log(`\n📧 [Email] To: ${recipient.email} | Subject: ${params.subject}\n${params.body}\n`);
      await prisma.emailNotification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } else {
      // DB-only mode (no RESEND_API_KEY)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Email] Queued (no Resend key): ${params.template} → ${recipient.email} | ${params.subject}`);
      }
    }
  } catch (error) {
    logger.error('email.send.failed', {
      tenantId: params.tenantId,
      recipientId: params.recipientId,
      template: params.template,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Build HTML email from template
 */
function buildEmailHtml(params: { recipientName: string; subject: string; body: string; template: EmailTemplate }): string {
  const { recipientName, subject, body, template } = params;

  // Template-specific colors
  const colors: Record<EmailTemplate, { accent: string; emoji: string }> = {
    HEART_RECEIVED: { accent: '#ec4899', emoji: '♥' },
    GOAL_APPROVED: { accent: '#22c55e', emoji: '✓' },
    GOAL_NEEDS_REVISION: { accent: '#f97316', emoji: '↩' },
    REVIEW_DUE: { accent: '#8b5cf6', emoji: '📋' },
    REVIEW_DELIVERED: { accent: '#8b5cf6', emoji: '📊' },
    EVENT_INVITE: { accent: '#6366f1', emoji: '📅' },
  };

  const { accent, emoji } = colors[template] || { accent: '#6366f1', emoji: '📬' };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background-color:${accent};padding:24px 32px;">
          <span style="font-size:28px;margin-right:8px;">${emoji}</span>
          <span style="color:#ffffff;font-size:18px;font-weight:700;">${subject}</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${recipientName},</p>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;white-space:pre-line;">${body}</p>
          <a href="${APP_URL}/dashboard/feed" style="display:inline-block;background-color:${accent};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
            Open AspireHub
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Sent by AspireHub · Bistec Global</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Helper functions (unchanged API) ──

export async function notifyHeartReceived(tenantId: string, receiverId: string, senderName: string, valueName: string, message?: string, heartId?: string) {
  await sendEmail({
    tenantId,
    recipientId: receiverId,
    template: 'HEART_RECEIVED',
    subject: `${senderName} recognized you for ${valueName}`,
    body: `${senderName} gave you a Heart for "${valueName}"${message ? `:\n\n"${message}"` : ''}\n\nLog in to see your Hearts profile and give recognition to others.`,
    entityType: 'HEART',
    entityId: heartId,
  });
}

export async function notifyGoalStatus(tenantId: string, recipientId: string, goalTitle: string, status: string, comment?: string, goalId?: string) {
  const isApproved = status === 'ACTIVE';
  await sendEmail({
    tenantId,
    recipientId,
    template: isApproved ? 'GOAL_APPROVED' : 'GOAL_NEEDS_REVISION',
    subject: isApproved ? `Goal approved: ${goalTitle}` : `Goal needs revision: ${goalTitle}`,
    body: isApproved
      ? `Your goal "${goalTitle}" has been approved! You can now start tracking your progress.`
      : `Your goal "${goalTitle}" needs some changes.\n\nFeedback from your manager:\n${comment || '(No comment provided)'}\n\nPlease review the feedback and resubmit your goal.`,
    entityType: 'GOAL',
    entityId: goalId,
  });
}

export async function notifyReviewReady(tenantId: string, recipientId: string, cycleName: string, cycleId?: string) {
  await sendEmail({
    tenantId,
    recipientId,
    template: 'REVIEW_DELIVERED',
    subject: `Your ${cycleName} review is ready`,
    body: `Your performance review for ${cycleName} has been finalized and is ready to view.\n\nThis review includes your goals, hearts received from peers, and your manager's assessment.`,
    entityType: 'REVIEW',
    entityId: cycleId,
  });
}

export async function notifyEventInvite(tenantId: string, recipientId: string, eventTitle: string, eventDate: string, location?: string) {
  await sendEmail({
    tenantId,
    recipientId,
    template: 'EVENT_INVITE',
    subject: `You're invited: ${eventTitle}`,
    body: `You've been invited to "${eventTitle}"\n\nDate: ${eventDate}${location ? `\nLocation: ${location}` : ''}\n\nLog in to confirm or decline your attendance.`,
  });
}

export async function notifyReviewDue(tenantId: string, recipientId: string, cycleName: string, dueDate: string, pendingCount: number) {
  await sendEmail({
    tenantId,
    recipientId,
    template: 'REVIEW_DUE',
    subject: `Reminder: ${cycleName} reviews due ${dueDate}`,
    body: `You have ${pendingCount} review(s) pending for ${cycleName}.\n\nDeadline: ${dueDate}\n\nPlease complete your reviews before the deadline.`,
  });
}
