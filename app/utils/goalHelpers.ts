/**
 * Shared goal helper functions — eliminates duplication across
 * GoalsTable, AdminGoalsTable, and manager/employee pages.
 */

interface GoalLike {
  employeeId?: string;
  managerId?: string | null;
  employee?: { id?: string; email?: string } | null;
  manager?: { id?: string } | null;
  createdBy?: { id?: string } | null;
}

/** Check if a goal was self-created by the employee (no manager assigned). */
export function isSelfCreatedGoal(goal: GoalLike): boolean {
  return !!(
    goal.employee &&
    (!goal.managerId || goal.managerId === null || goal.managerId === '')
  );
}

/** Check if the current user is the employee who owns this goal. */
export function isOwnGoal(goal: GoalLike, userEmail?: string): boolean {
  return !!userEmail && goal.employee?.email === userEmail;
}

/** Check if the current user is the manager who assigned this goal. */
export function isAssignedByUser(goal: GoalLike, userId?: string): boolean {
  return !!userId && goal.managerId === userId;
}

/** Format a status string for display (e.g. IN_PROGRESS → In Progress). */
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w+/g, w => w.toLowerCase());
}
