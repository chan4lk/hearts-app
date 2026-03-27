import { Role } from './auth';
import { TenantContext } from './tenantScope';

/**
 * Role hierarchy for cascading permissions.
 * ADMIN (3) > MANAGER (2) > EMPLOYEE (1)
 *
 * Admin can do everything Manager can do.
 * Manager can do everything Employee can do.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

/**
 * Check if user has at least the minimum required role (cascading).
 *
 * Examples:
 * - hasMinRole(ctx, 'EMPLOYEE') → true for all roles
 * - hasMinRole(ctx, 'MANAGER') → true for MANAGER and ADMIN
 * - hasMinRole(ctx, 'ADMIN') → true only for ADMIN
 */
export function hasMinRole(ctx: TenantContext, minRole: Role): boolean {
  return ROLE_HIERARCHY[ctx.userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Check if user has exactly one of the specified roles.
 *
 * Example: hasRole(ctx, 'ADMIN', 'MANAGER') → true if ADMIN or MANAGER
 */
export function hasRole(ctx: TenantContext, ...roles: Role[]): boolean {
  return roles.includes(ctx.userRole);
}

/**
 * Require minimum role or throw 403 response.
 * Use in API routes that need role enforcement.
 *
 * Usage:
 * ```
 * const ctx = await requireTenantContext();
 * requireMinRole(ctx, 'MANAGER'); // throws 403 if Employee
 * ```
 */
export function requireMinRole(ctx: TenantContext, minRole: Role): void {
  if (!hasMinRole(ctx, minRole)) {
    throw new Response(
      JSON.stringify({ error: 'Forbidden', code: 'FORBIDDEN' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Require exact role(s) or throw 403 response.
 *
 * Usage:
 * ```
 * requireRole(ctx, 'ADMIN'); // only admin
 * requireRole(ctx, 'ADMIN', 'MANAGER'); // admin or manager (no cascading)
 * ```
 */
export function requireRole(ctx: TenantContext, ...roles: Role[]): void {
  if (!hasRole(ctx, ...roles)) {
    throw new Response(
      JSON.stringify({ error: 'Forbidden', code: 'FORBIDDEN' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Check if a user is the manager of a specific employee.
 * Used for manager-scoped operations (approve goals, write reviews).
 */
export function isManagerOf(ctx: TenantContext, employeeManagerId: string | null): boolean {
  if (ctx.userRole === 'ADMIN') return true; // Admin can act as any manager
  return ctx.userId === employeeManagerId;
}

/**
 * Require that the user is the manager of the employee, or throw 403.
 */
export function requireManagerOf(ctx: TenantContext, employeeManagerId: string | null): void {
  if (!isManagerOf(ctx, employeeManagerId)) {
    throw new Response(
      JSON.stringify({ error: 'Forbidden — not the assigned manager', code: 'FORBIDDEN' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
