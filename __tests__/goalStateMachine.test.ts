import { describe, it, expect } from 'vitest';
import { canTransition, getValidTransitions } from '../app/utils/goalStateMachine';

describe('Goal State Machine', () => {
  describe('canTransition', () => {
    // DRAFT transitions
    it('DRAFT → PENDING (submit)', () => expect(canTransition('DRAFT', 'PENDING')).toBe(true));
    it('DRAFT → CLOSED (abandon)', () => expect(canTransition('DRAFT', 'CLOSED')).toBe(true));
    it('DRAFT → ACTIVE (invalid)', () => expect(canTransition('DRAFT', 'ACTIVE')).toBe(false));
    it('DRAFT → COMPLETED (invalid)', () => expect(canTransition('DRAFT', 'COMPLETED')).toBe(false));

    // PENDING transitions
    it('PENDING → ACTIVE (approve)', () => expect(canTransition('PENDING', 'ACTIVE')).toBe(true));
    it('PENDING → NEEDS_REVISION (revise)', () => expect(canTransition('PENDING', 'NEEDS_REVISION')).toBe(true));
    it('PENDING → CLOSED', () => expect(canTransition('PENDING', 'CLOSED')).toBe(true));
    it('PENDING → DRAFT (invalid)', () => expect(canTransition('PENDING', 'DRAFT')).toBe(false));

    // NEEDS_REVISION transitions
    it('NEEDS_REVISION → PENDING (resubmit)', () => expect(canTransition('NEEDS_REVISION', 'PENDING')).toBe(true));
    it('NEEDS_REVISION → CLOSED', () => expect(canTransition('NEEDS_REVISION', 'CLOSED')).toBe(true));
    it('NEEDS_REVISION → ACTIVE (invalid)', () => expect(canTransition('NEEDS_REVISION', 'ACTIVE')).toBe(false));

    // ACTIVE transitions
    it('ACTIVE → COMPLETED', () => expect(canTransition('ACTIVE', 'COMPLETED')).toBe(true));
    it('ACTIVE → CLOSED', () => expect(canTransition('ACTIVE', 'CLOSED')).toBe(true));
    it('ACTIVE → DRAFT (invalid)', () => expect(canTransition('ACTIVE', 'DRAFT')).toBe(false));
    it('ACTIVE → PENDING (invalid)', () => expect(canTransition('ACTIVE', 'PENDING')).toBe(false));

    // COMPLETED transitions
    it('COMPLETED → CLOSED', () => expect(canTransition('COMPLETED', 'CLOSED')).toBe(true));
    it('COMPLETED → ACTIVE (invalid)', () => expect(canTransition('COMPLETED', 'ACTIVE')).toBe(false));

    // CLOSED transitions
    it('CLOSED → any (invalid)', () => {
      expect(canTransition('CLOSED', 'DRAFT')).toBe(false);
      expect(canTransition('CLOSED', 'ACTIVE')).toBe(false);
      expect(canTransition('CLOSED', 'COMPLETED')).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    it('DRAFT can go to PENDING or CLOSED', () => {
      expect(getValidTransitions('DRAFT')).toEqual(['PENDING', 'CLOSED']);
    });

    it('ACTIVE can go to COMPLETED or CLOSED', () => {
      expect(getValidTransitions('ACTIVE')).toEqual(['COMPLETED', 'CLOSED']);
    });

    it('CLOSED has no valid transitions', () => {
      expect(getValidTransitions('CLOSED')).toEqual([]);
    });
  });
});
