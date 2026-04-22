import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { requireMinRole } from '@/lib/rbac';
import { logAudit, AuditAction } from '@/lib/auditLog';
import { logger } from '@/lib/logger';

/**
 * POST — Import users from CSV data
 *
 * Expected CSV columns (header row required). Aliases accepted per column:
 *   Name                                               — Name | name
 *   Email (required)                                   — Email | email
 *   Department                                         — Department | department
 *   Position / Designation                             — Position | Designation | position
 *   JobCategory                                        — JobCategory | "Job Category" | jobCategory
 *   AppointmentDate                                    — AppointmentDate | "Date of Appointment" | appointmentDate
 *   ReviewMonth (Adjusted Review Month wins if both)   — "Adjusted Review Month" | ReviewMonth | "Review Month" | reviewMonth
 *   Manager (by email first, else by name)             — ManagerEmail | "Reporting Person Email" | managerEmail |
 *                                                        ManagerName  | "Reporting Person"       | managerName
 *
 * - If user exists (by email) → update fields
 * - If user doesn't exist → create with EMPLOYEE role
 * - ManagerEmail is resolved to managerId after all users are created
 */
function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

/**
 * Parse dates from imported spreadsheets. Handles:
 *  - ISO: "2024-09-12"
 *  - D/M/Y: "12/9/2024" (common in LK/UK)
 *  - M/D/Y: "9/12/2024" (common in US)
 *  - Dotted: "12.9.2024"
 *
 * If the first component is > 12, it must be the day (D/M/Y). Otherwise
 * we assume D/M/Y because that's the Excel convention at BISTEC. This is
 * deliberate — admins can correct any misparsed dates from the Review
 * Schedule tab's "Adjust" action.
 */
function parseFlexibleDate(raw: unknown): Date | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // ISO first (unambiguous)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parts = str.split(/[/.\-]/).map((s) => s.trim());
  if (parts.length === 3) {
    let [a, b, y] = parts.map((p) => parseInt(p, 10));
    if ([a, b, y].some((n) => Number.isNaN(n))) return null;
    // 2-digit year → assume 20xx
    if (y < 100) y += 2000;
    // If first component > 12, it's day. Otherwise assume D/M/Y (LK default).
    const day = a > 12 ? a : a;
    const month = a > 12 ? b : b;
    const actualDay = a > 12 ? a : a; // always treat first as day when possible
    const actualMonth = a > 12 ? b : b;
    // Final: assume D/M/Y
    const d = new Date(y, actualMonth - 1, actualDay);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Last resort — let Date() try
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  requireMinRole(ctx, 'ADMIN');

  try {
    const body = await req.json();
    const { rows, mode } = body as { rows: any[]; mode?: 'preview' | 'commit' };
    const isPreview = mode === 'preview';

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data provided', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows allowed', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    interface SkippedRow {
      email: string;
      name: string;
      reason: 'not_in_system' | 'invalid';
      // Full row data — carried to the client so admin can invite later.
      reportingPersonEmail: string | null;
      reportingPersonName: string | null;
      jobCategory: string | null;
      position: string | null;
      department: string | null;
      appointmentDate: string | null; // ISO string
      reviewMonth: string | null;
    }

    const results = {
      created: 0,                // always 0 under the new "matches only" rule
      updated: 0,
      skipped: 0,                // total of notInSystem + invalid
      notInSystem: 0,
      invalid: 0,
      errors: [] as string[],
      skippedRows: [] as SkippedRow[], // full data for UI invitation flow
      preview: isPreview ? ([] as Array<{ email: string; name: string; action: 'update' | 'skip'; reason?: string }>) : undefined,
    };

    // Phase 1: Update existing users. Unmatched rows → skipped (tracked, not created).
    for (const row of rows) {
      try {
        const email = (row.Email || row.email || '').toString().trim().toLowerCase();
        const name = (row.Name || row.name || '').toString().trim();
        const reportingPersonEmail = (row.ManagerEmail || row['Reporting Person Email'] || row.managerEmail || '').toString().trim().toLowerCase() || null;
        const reportingPersonName = (row.ManagerName || row['Reporting Person'] || row.managerName || '').toString().trim() || null;
        const jobCategory = (row.JobCategory || row['Job Category'] || row.jobCategory || null)?.toString().trim() || null;
        const position = (row.Position || row.Designation || row.position || null)?.toString().trim() || null;
        const department = (row.Department || row.department || null)?.toString().trim() || null;
        const reviewMonth = (
          row['Adjusted'] || row.Adjusted ||
          row['Adjusted Review Month'] || row.AdjustedReviewMonth ||
          row['Review month'] || row['Review Month'] || row.ReviewMonth || row.reviewMonth ||
          row['After 6 Months'] || row['After 6 months'] || row.After6Months ||
          null
        )?.toString().trim() || null;
        const dateStr = row.AppointmentDate || row['Date of Appointment'] || row.appointmentDate || null;
        const appointmentDateParsed = parseFlexibleDate(dateStr);

        if (!email || !name) {
          results.errors.push(`Skipped row: missing name or email`);
          results.invalid++;
          results.skipped++;
          if (isPreview) {
            results.preview!.push({ email: email || '(blank)', name: name || '(blank)', action: 'skip', reason: 'missing name or email' });
          }
          results.skippedRows.push({
            email: email || '', name: name || '', reason: 'invalid',
            reportingPersonEmail, reportingPersonName, jobCategory, position, department,
            appointmentDate: appointmentDateParsed?.toISOString() || null, reviewMonth,
          });
          continue;
        }

        const data: any = {
          name,
          department,
          position,
          jobCategory,
          reviewMonth,
        };
        if (appointmentDateParsed) {
          data.appointmentDate = appointmentDateParsed;
          data.nextReviewDate = addMonths(appointmentDateParsed, 6);
        }

        // Check if user exists
        const existing = await prisma.user.findFirst({
          where: { tenantId: ctx.tenantId, email: { equals: email, mode: 'insensitive' } },
        });

        if (existing) {
          // Preserve an admin-adjusted nextReviewDate: only overwrite if the
          // current row brings a new appointment date that differs.
          if (existing.nextReviewDate && existing.appointmentDate?.toISOString() === data.appointmentDate?.toISOString()) {
            delete data.nextReviewDate;
          }
          if (!isPreview) await prisma.user.update({ where: { id: existing.id }, data });
          results.updated++;
          if (isPreview) results.preview!.push({ email, name, action: 'update' });
        } else {
          // NEW BEHAVIOR: unmatched users are SKIPPED, not created.
          // Their full row data is returned so the client can invite them.
          results.notInSystem++;
          results.skipped++;
          results.skippedRows.push({
            email, name, reason: 'not_in_system',
            reportingPersonEmail, reportingPersonName, jobCategory, position, department,
            appointmentDate: appointmentDateParsed?.toISOString() || null, reviewMonth,
          });
          if (isPreview) {
            results.preview!.push({ email, name, action: 'skip', reason: 'not in system — invite to create' });
          }
          // No DB writes for skipped rows — client surfaces them in a
          // "Review import results" modal so admin can bulk-invite.
        }
      } catch (rowError: any) {
        results.errors.push(`Error for ${row.Email || 'unknown'}: ${rowError.message}`);
        results.skipped++;
      }
    }

    if (isPreview) {
      return NextResponse.json(results);
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
