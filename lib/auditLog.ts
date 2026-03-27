import { prisma } from './prisma';
import { TenantContext } from './tenantScope';

/**
 * Standard audit actions used across the application.
 * Use these constants to ensure consistent action naming.
 */
export const AuditAction = {
  // User management
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_MANAGER_ASSIGNED: 'USER_MANAGER_ASSIGNED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_AUTO_PROVISIONED: 'USER_AUTO_PROVISIONED',

  // Goals
  GOAL_CREATED: 'GOAL_CREATED',
  GOAL_SUBMITTED: 'GOAL_SUBMITTED',
  GOAL_APPROVED: 'GOAL_APPROVED',
  GOAL_REVISION_REQUESTED: 'GOAL_REVISION_REQUESTED',
  GOAL_ACCEPTED: 'GOAL_ACCEPTED',
  GOAL_COMPLETED: 'GOAL_COMPLETED',
  GOAL_CLOSED: 'GOAL_CLOSED',
  GOAL_ASSIGNED: 'GOAL_ASSIGNED',

  // Reviews
  REVIEW_CYCLE_CREATED: 'REVIEW_CYCLE_CREATED',
  REVIEW_CYCLE_ACTIVATED: 'REVIEW_CYCLE_ACTIVATED',
  SELF_REVIEW_SUBMITTED: 'SELF_REVIEW_SUBMITTED',
  MANAGER_REVIEW_SUBMITTED: 'MANAGER_REVIEW_SUBMITTED',
  REVIEW_FINALIZED: 'REVIEW_FINALIZED',

  // Events
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  EVENT_PARTICIPATION_CHANGED: 'EVENT_PARTICIPATION_CHANGED',

  // Company values
  VALUE_CREATED: 'VALUE_CREATED',
  VALUE_DEACTIVATED: 'VALUE_DEACTIVATED',

  // Data export
  DATA_EXPORTED: 'DATA_EXPORTED',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * Log an audit event. Append-only — audit logs are never updated or deleted.
 *
 * Usage:
 * ```
 * await logAudit(ctx, {
 *   action: AuditAction.GOAL_APPROVED,
 *   entity: 'Goal',
 *   entityId: goal.id,
 *   details: { previousStatus: 'PENDING', newStatus: 'ACTIVE' },
 * });
 * ```
 */
export async function logAudit(
  ctx: TenantContext,
  params: {
    action: AuditActionType | string;
    entity: string;
    entityId: string;
    details?: object;
  }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: (params.details as any) ?? undefined,
      },
    });
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('Failed to write audit log:', error);
  }
}
