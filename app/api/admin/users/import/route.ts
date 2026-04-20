import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { logger } from '@/lib/logger';

/**
 * POST — Import users from CSV data
 *
 * Expected CSV columns (header row required):
 * Name, Email, Department, Position, JobCategory, AppointmentDate, ReviewMonth, ManagerEmail
 *
 * - If user exists (by email) → update fields
 * - If user doesn't exist → create with EMPLOYEE role
 * - ManagerEmail is resolved to managerId after all users are created
 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  try {
    const body = await req.json();
    const { rows } = body as { rows: any[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data provided', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows allowed', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };

    // Phase 1: Create/update all users
    for (const row of rows) {
      try {
        const email = (row.Email || row.email || '').trim().toLowerCase();
        const name = (row.Name || row.name || '').trim();

        if (!email || !name) {
          results.errors.push(`Skipped row: missing name or email`);
          continue;
        }

        const data: any = {
          name,
          department: (row.Department || row.department || null)?.trim() || null,
          position: (row.Position || row.Designation || row.position || null)?.trim() || null,
          jobCategory: (row.JobCategory || row['Job Category'] || row.jobCategory || null)?.trim() || null,
          reviewMonth: (row.ReviewMonth || row['Review Month'] || row.reviewMonth || null)?.trim() || null,
        };

        // Parse appointment date
        const dateStr = row.AppointmentDate || row['Date of Appointment'] || row.appointmentDate || null;
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) data.appointmentDate = parsed;
        }

        // Check if user exists
        const existing = await prisma.user.findFirst({
          where: { tenantId: ctx.tenantId, email: { equals: email, mode: 'insensitive' } },
        });

        if (existing) {
          await prisma.user.update({ where: { id: existing.id }, data });
          results.updated++;
        } else {
          await prisma.user.create({
            data: { tenantId: ctx.tenantId, email, role: 'EMPLOYEE', ...data },
          });
          results.created++;
        }
      } catch (rowError: any) {
        results.errors.push(`Error for ${row.Email || 'unknown'}: ${rowError.message}`);
      }
    }

    // Phase 2: Resolve manager relationships
    for (const row of rows) {
      const email = (row.Email || row.email || '').trim().toLowerCase();
      const managerEmail = (row.ManagerEmail || row['Reporting Person Email'] || row.managerEmail || '').trim().toLowerCase();
      const managerName = (row.ManagerName || row['Reporting Person'] || row.managerName || '').trim();

      if (!email || (!managerEmail && !managerName)) continue;

      try {
        const user = await prisma.user.findFirst({
          where: { tenantId: ctx.tenantId, email: { equals: email, mode: 'insensitive' } },
        });

        let manager = null;
        if (managerEmail) {
          manager = await prisma.user.findFirst({
            where: { tenantId: ctx.tenantId, email: { equals: managerEmail, mode: 'insensitive' } },
          });
        } else if (managerName) {
          manager = await prisma.user.findFirst({
            where: { tenantId: ctx.tenantId, name: { equals: managerName, mode: 'insensitive' } },
          });
        }

        if (user && manager && user.id !== manager.id) {
          await prisma.user.update({ where: { id: user.id }, data: { managerId: manager.id } });
        }
      } catch (err) {
        logger.warn('admin.users.import.manager_resolution_failed', {
          tenantId: ctx.tenantId,
          userEmail: row.Email,
          managerEmail: row.ManagerEmail,
          managerName: row.ManagerName,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }

    await logAudit(ctx, {
      action: 'USER_IMPORT',
      entity: 'User',
      entityId: 'bulk',
      details: { created: results.created, updated: results.updated, errors: results.errors.length },
    });

    return NextResponse.json(results);
  } catch (error: any) {
    logger.error('admin.users.import.failed', {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Import failed: ' + error.message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
