import { GoalStatus } from '@prisma/client';

/**
 * Goal state machine: valid transitions
 * DRAFT → PENDING (submit for review)
 * PENDING → ACTIVE (approved) | NEEDS_REVISION (sent back)
 * NEEDS_REVISION → PENDING (resubmitted)
 * ACTIVE → COMPLETED | CLOSED
 * Any → CLOSED (admin/manager can close from any state)
 */
const VALID_TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  DRAFT: ['PENDING', 'CLOSED'],
  PENDING: ['ACTIVE', 'NEEDS_REVISION', 'CLOSED'],
  NEEDS_REVISION: ['PENDING', 'CLOSED'],
  ACTIVE: ['COMPLETED', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
};

export function canTransition(from: GoalStatus, to: GoalStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: GoalStatus): GoalStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}
