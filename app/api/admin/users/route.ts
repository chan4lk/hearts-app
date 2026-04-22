import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/securityUtils';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const { searchParams } = new URL(req.url);
  const department = searchParams.get('department');
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);

  const where: any = { tenantId: ctx.tenantId };
  if (department) where.department = department;
  if (role) where.role = role;
  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      position: true,
      jobCategory: true,
      appointmentDate: true,
      reviewMonth: true,
      nextReviewDate: true,
      lastReviewCompletedAt: true,
      reviewReminderSentAt: true,
      isActive: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      createdAt: true,
      lastLoginAt: true,
      badges: { select: { kind: true } },
    },
    orderBy: { name: 'asc' },
    take: limit,
  });

  // Flatten badges into a simple string[] per user for easy client-side filtering
  const mapped = users.map((u) => ({
    ...u,
    badges: u.badges.map((b) => b.kind),
  }));

  return NextResponse.json(mapped);
}

// ── POST — create a single user + optionally send an invitation email ──────
const CreateUserSchema = z.object({
  name: z.string().min(1).max(200).transform(sanitizeInput)
    .refine((s) => s.length > 0, 'Name cannot be empty'),
  email: z.string().email().max(200).transform((s) => s.trim().toLowerCase()),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  managerId: z.string().nullable().optional(),
  department: z.string().max(100).transform(sanitizeInput).nullable().optional(),
  position: z.string().max(100).transform(sanitizeInput).nullable().optional(),
  sendInvitation: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json().catch(() => ({}));
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Email must be unique within the tenant (case-insensitive).
  const existing = await prisma.user.findFirst({
    where: { tenantId: ctx.tenantId, email: { equals: data.email, mode: 'insensitive' } },
    select: { id: true, email: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `A user with email ${existing.email} already exists.`, code: 'CONFLICT' },
      { status: 409 }
    );
  }

  // If a manager was assigned, validate they exist and are active in this tenant.
  if (data.managerId) {
    const manager = await prisma.user.findFirst({
      where: { id: data.managerId, tenantId: ctx.tenantId, isActive: true },
      select: { id: true },
    });
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found', code: 'NOT_FOUND' }, { status: 404 });
    }
  }

  const created = await prisma.user.create({
    data: {
      tenantId: ctx.tenantId,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department || null,
      position: data.position || null,
      managerId: data.managerId || null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      position: true,
      isActive: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
    },
  });

  await logAudit(ctx, {
    action: AuditAction.USER_AUTO_PROVISIONED,
    entity: 'User',
    entityId: created.id,
    details: { email: created.email, role: created.role, source: 'admin_create_form' },
  });

  // Fire-and-forget invitation email. Failures don't block user creation —
  // admin can re-send later from the Invite modal.
  let invited = false;
  if (data.sendInvitation) {
    try {
      const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      await sendEmail({
        tenantId: ctx.tenantId,
        recipientId: created.id,
        template: 'EVENT_INVITE',
        subject: `Welcome to AspireHub — sign in to get started`,
        body: [
          `Hi ${created.name.split(' ')[0]},`,
          ``,
          `Your AspireHub account has been created. AspireHub is where your team recognizes great work, tracks goals, and completes performance reviews.`,
          ``,
          `Sign in with your work email at ${loginUrl}/login.`,
          ``,
          `Your role is ${created.role.toLowerCase()}.`,
          ``,
          `— AspireHub`,
        ].join('\n'),
      });
      invited = true;
    } catch (err) {
      logger.warn('admin.users.create.invitation_failed', {
        userId: created.id,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  return NextResponse.json({ ...created, invited }, { status: 201 });
}
