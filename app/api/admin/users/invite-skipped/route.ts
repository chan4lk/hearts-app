import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * Create user records for "skipped" rows from a CSV import (users whose
 * email wasn't yet in the system) AND send each one a login invitation email.
 *
 * Client supplies full row data from the import preview so we preserve
 * Job Category, Designation, Appointment date, Review month, and attempt to
 * link Reporting Person.
 *
 * Admin-only.
 */

const InvitationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  department: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  jobCategory: z.string().nullable().optional(),
  reviewMonth: z.string().nullable().optional(),
  appointmentDate: z.string().nullable().optional(), // ISO
  reportingPersonEmail: z.string().nullable().optional(),
  reportingPersonName: z.string().nullable().optional(),
});

const BodySchema = z.object({
  invitations: z.array(InvitationSchema).min(1).max(500),
});

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const results = { created: 0, invited: 0, alreadyExists: 0, errors: [] as string[] };

  // Pass 1: create user records (or reuse existing)
  const createdIds: string[] = [];
  for (const inv of parsed.data.invitations) {
    const email = inv.email.trim().toLowerCase();
    try {
      const existing = await prisma.user.findFirst({
        where: { tenantId: ctx.tenantId, email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existing) {
        results.alreadyExists++;
        createdIds.push(existing.id);
        continue;
      }
      const appointmentDate = inv.appointmentDate ? new Date(inv.appointmentDate) : null;
      const created = await prisma.user.create({
        data: {
          tenantId: ctx.tenantId,
          email,
          name: inv.name.trim(),
          role: 'EMPLOYEE',
          department: inv.department || null,
          position: inv.position || null,
          jobCategory: inv.jobCategory || null,
          reviewMonth: inv.reviewMonth || null,
          appointmentDate,
          nextReviewDate: appointmentDate ? addMonths(appointmentDate, 6) : null,
          isActive: true,
        },
        select: { id: true },
      });
      results.created++;
      createdIds.push(created.id);
    } catch (err) {
      results.errors.push(`${inv.email}: create failed — ${err instanceof Error ? err.message : 'unknown'}`);
      createdIds.push('');
    }
  }

  // Pass 2: link reporting persons now that all users exist
  for (const inv of parsed.data.invitations) {
    const reportingName = inv.reportingPersonName?.trim();
    const reportingEmail = inv.reportingPersonEmail?.trim().toLowerCase();
    if (!reportingName && !reportingEmail) continue;
    try {
      const user = await prisma.user.findFirst({
        where: { tenantId: ctx.tenantId, email: { equals: inv.email.toLowerCase(), mode: 'insensitive' } },
        select: { id: true },
      });
      if (!user) continue;
      let manager = null;
      if (reportingEmail) {
        manager = await prisma.user.findFirst({
          where: { tenantId: ctx.tenantId, email: { equals: reportingEmail, mode: 'insensitive' } },
          select: { id: true },
        });
      }
      if (!manager && reportingName) {
        manager = await prisma.user.findFirst({
          where: { tenantId: ctx.tenantId, name: { equals: reportingName, mode: 'insensitive' } },
          select: { id: true },
        });
      }
      if (manager && manager.id !== user.id) {
        await prisma.user.update({ where: { id: user.id }, data: { managerId: manager.id } });
      }
    } catch (err) {
      logger.warn('admin.users.invite_skipped.manager_resolution_failed', {
        userEmail: inv.email,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  // Pass 3: email each user
  for (let i = 0; i < parsed.data.invitations.length; i++) {
    const inv = parsed.data.invitations[i];
    const recipientId = createdIds[i];
    if (!recipientId) continue;
    try {
      await sendEmail({
        tenantId: ctx.tenantId,
        recipientId,
        template: 'EVENT_INVITE',
        subject: `Welcome to AspireHub — sign in to get started`,
        body: [
          `Hi ${inv.name.split(' ')[0]},`,
          ``,
          `Your AspireHub account has been created. AspireHub is where your team recognizes great work, tracks goals, and completes performance reviews.`,
          ``,
          `Sign in with your work email at ${loginUrl}/login — click "Sign in with Microsoft".`,
          ``,
          `— AspireHub`,
        ].join('\n'),
      });
      results.invited++;
    } catch (err) {
      results.errors.push(`${inv.email}: email failed — ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  await logAudit(ctx, {
    action: AuditAction.LOGIN_INVITATIONS_SENT,
    entity: 'User',
    entityId: 'bulk',
    details: {
      created: results.created,
      invited: results.invited,
      alreadyExists: results.alreadyExists,
      source: 'import_skipped_users',
    },
  });

  logger.info('admin.users.invite_skipped.completed', results);
  return NextResponse.json(results);
}
