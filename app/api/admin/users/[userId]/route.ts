import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  managerId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  department: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  jobCategory: z.string().nullable().optional(),
  appointmentDate: z.string().nullable().optional(),
  reviewMonth: z.string().nullable().optional(),
  // Review-schedule fields
  nextReviewDate: z.string().nullable().optional(),
  markReviewComplete: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const { userId } = await params;
  const data = parsed.data;

  // Verify user belongs to same tenant
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: ctx.tenantId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  // Prevent admin from deactivating themselves
  if (data.isActive === false && userId === ctx.userId) {
    return NextResponse.json({ error: 'Cannot deactivate your own account', code: 'CONFLICT' }, { status: 409 });
  }

  // Prevent admin from demoting themselves
  if (data.role && data.role !== 'ADMIN' && userId === ctx.userId) {
    return NextResponse.json({ error: 'Cannot change your own role', code: 'CONFLICT' }, { status: 409 });
  }

  // If assigning a manager, verify manager exists and belongs to same tenant
  if (data.managerId) {
    const manager = await prisma.user.findFirst({
      where: { id: data.managerId, tenantId: ctx.tenantId, isActive: true },
    });
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found', code: 'NOT_FOUND' }, { status: 404 });
    }
  }

  // When marking review complete: stamp lastReviewCompletedAt now, roll
  // nextReviewDate +12 months, and clear the reminder timestamp so the
  // next cycle can re-send.
  let reviewCompleteUpdate: Record<string, unknown> = {};
  if (data.markReviewComplete) {
    const now = new Date();
    const prev = user.nextReviewDate ?? now;
    const next = new Date(prev);
    next.setMonth(next.getMonth() + 12);
    reviewCompleteUpdate = {
      lastReviewCompletedAt: now,
      nextReviewDate: next,
      reviewReminderSentAt: null,
    };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.role !== undefined && { role: data.role }),
      ...(data.managerId !== undefined && { managerId: data.managerId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.jobCategory !== undefined && { jobCategory: data.jobCategory }),
      ...(data.appointmentDate !== undefined && { appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : null }),
      ...(data.reviewMonth !== undefined && { reviewMonth: data.reviewMonth }),
      ...(data.nextReviewDate !== undefined && {
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
        // Admin-override of the date resets any outstanding reminder stamp.
        reviewReminderSentAt: null,
      }),
      ...reviewCompleteUpdate,
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

  // Audit log for each change
  if (data.role !== undefined && data.role !== user.role) {
    await logAudit(ctx, {
      action: AuditAction.USER_ROLE_CHANGED,
      entity: 'User',
      entityId: userId,
      details: { previousRole: user.role, newRole: data.role },
    });
  }

  if (data.managerId !== undefined && data.managerId !== user.managerId) {
    await logAudit(ctx, {
      action: AuditAction.USER_MANAGER_ASSIGNED,
      entity: 'User',
      entityId: userId,
      details: { previousManagerId: user.managerId, newManagerId: data.managerId },
    });
  }

  if (data.isActive !== undefined && data.isActive !== user.isActive) {
    await logAudit(ctx, {
      action: data.isActive ? AuditAction.USER_REACTIVATED : AuditAction.USER_DEACTIVATED,
      entity: 'User',
      entityId: userId,
    });
  }

  return NextResponse.json(updated);
}
