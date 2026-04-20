import { GoalStatus } from '@prisma/client';

/**
 * DRAFT → PENDING (submit) | CLOSED
 * PENDING → ACTIVE (approve) | NEEDS_REVISION (revise) | CLOSED
 * NEEDS_REVISION → PENDING (resubmit) | CLOSED
 * ACTIVE → COMPLETED | ON_HOLD | BLOCKED | CLOSED
 * ON_HOLD → ACTIVE (resume) | CLOSED
 * BLOCKED → ACTIVE (resume) | CLOSED
 * COMPLETED → CLOSED
 * CLOSED → (terminal)
 */
const VALID_TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  DRAFT: ['PENDING', 'CLOSED'],
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
