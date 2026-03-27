import { getServerSession } from 'next-auth';
import { authOptions, Role } from './auth';

/**
 * Tenant context extracted from session.
 * Every API route and server component should use this to scope queries.
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: Role;
  userName: string;
  userEmail: string;
}

/**
 * Default tenant ID for Phase 1 (BISTEC internal).
 * In Phase 2, this will be derived from subdomain or session.
 */
const DEFAULT_TENANT_ID = 'bistec-global';

/**
 * Get tenant context from the current session.
 * Returns null if not authenticated.
 *
 * Usage in API routes:
 * ```
 * const ctx = await getTenantContext();
 * if (!ctx) return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
 * const goals = await prisma.goal.findMany({ where: { tenantId: ctx.tenantId, ownerId: ctx.userId } });
 * ```
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    tenantId: DEFAULT_TENANT_ID, // Phase 1: single tenant. Phase 2: derive from session/subdomain
    userId: session.user.id,
    userRole: session.user.role,
    userName: session.user.name,
    userEmail: session.user.email,
  };
}

/**
 * Get tenant context or throw 401 response.
 * Convenience wrapper for API routes that always require auth.
 *
 * Usage:
 * ```
 * const ctx = await requireTenantContext();
 * // If we get here, ctx is guaranteed non-null
 * ```
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return ctx;
}
