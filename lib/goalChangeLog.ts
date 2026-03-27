import { prisma } from './prisma';

/**
 * Log a change to a goal field for audit trail.
 * Call this before or after updating a goal.
 */
export async function logGoalChange(params: {
  goalId: string;
  changedBy: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string;
}) {
  try {
    await prisma.goalChangeLog.create({
      data: {
        goalId: params.goalId,
        changedBy: params.changedBy,
        fieldName: params.fieldName,
        oldValue: params.oldValue ?? null,
        newValue: params.newValue ?? null,
        reason: params.reason ?? null,
      } as any, // New model — remove `as any` after prisma generate
    });
  } catch {
    // Audit logging should never block the main operation
  }
}
