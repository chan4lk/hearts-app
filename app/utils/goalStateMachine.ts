import { GoalStatus } from '@prisma/client';

/**
 * DRAFT → PENDING (submit) | ACTIVE (admin self-approve only) | CLOSED
 * PENDING → ACTIVE (approve) | NEEDS_REVISION (revise) | CLOSED
 * NEEDS_REVISION → PENDING (resubmit) | CLOSED
 * ACTIVE → COMPLETED | ON_HOLD | BLOCKED | CLOSED
 * ON_HOLD → ACTIVE (resume) | CLOSED
 * BLOCKED → ACTIVE (resume) | CLOSED
 * COMPLETED → CLOSED
 * CLOSED → (terminal)
 *
 * Note on DRAFT→ACTIVE: only valid for admins submitting their OWN goal
 * when they have no manager above them (top of hierarchy). The /api/goals/:id
 * PATCH handler gates this — the state machine permits the transition so
 * canTransition() doesn't reject it, but authorization is enforced server-side.
 */
const VALID_TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  DRAFT: ['PENDING', 'ACTIVE', 'CLOSED'],
  PENDING: ['ACTIVE', 'NEEDS_REVISION', 'CLOSED'],
  NEEDS_REVISION: ['PENDING', 'CLOSED'],
  ACTIVE: ['COMPLETED', 'ON_HOLD', 'BLOCKED', 'CLOSED'],
  ON_HOLD: ['ACTIVE', 'CLOSED'],
  BLOCKED: ['ACTIVE', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
};

export function canTransition(from: GoalStatus, to: GoalStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: GoalStatus): GoalStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}
