import { describe, it, expect } from 'vitest';
import {
  createGoalSchema,
  updateGoalSchema,
  statusUpdateSchema,
  progressUpdateSchema,
  ratingSubmitSchema,
  approveRejectSchema,
  validatePassword,
} from '@/lib/validation';

// ============================================
// GOAL CREATION VALIDATION (Fix: M2 - Zod now enforced)
// ============================================

describe('createGoalSchema', () => {
  it('rejects empty title', () => {
    const result = createGoalSchema.safeParse({
      title: '',
      description: 'A valid description for the goal',
      category: 'PROFESSIONAL',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title under 3 chars', () => {
    const result = createGoalSchema.safeParse({
      title: 'Hi',
      description: 'A valid description for the goal',
      category: 'PROFESSIONAL',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description under 10 chars', () => {
    const result = createGoalSchema.safeParse({
      title: 'Valid title',
      description: 'Short',
      category: 'PROFESSIONAL',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = createGoalSchema.safeParse({
      title: 'Valid title',
      description: 'A valid description for the goal',
      category: 'INVALID_CATEGORY',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createGoalSchema.safeParse({
      title: 'Valid title',
      description: 'A valid description for the goal',
      category: 'PROFESSIONAL',
      dueDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid goal data', () => {
    const result = createGoalSchema.safeParse({
      title: 'Complete Q1 review',
      description: 'Finish all quarterly performance reviews for the team',
      category: 'PROFESSIONAL',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Complete Q1 review');
  });

  it('trims whitespace from title and description', () => {
    const result = createGoalSchema.safeParse({
      title: '  Complete Q1 review  ',
      description: '  Finish all quarterly performance reviews  ',
      category: 'PROFESSIONAL',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Complete Q1 review');
    expect(result.data?.description).toBe('Finish all quarterly performance reviews');
  });

  it('defaults priority to MEDIUM', () => {
    const result = createGoalSchema.safeParse({
      title: 'Valid title here',
      description: 'A valid description for the goal',
      category: 'TECHNICAL',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
    expect(result.data?.priority).toBe('MEDIUM');
  });
});

// ============================================
// STATUS UPDATE VALIDATION
// ============================================

describe('statusUpdateSchema', () => {
  it('rejects missing status', () => {
    const result = statusUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = statusUpdateSchema.safeParse({ status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects NOT_STARTED (removed from GoalStatus)', () => {
    const result = statusUpdateSchema.safeParse({ status: 'NOT_STARTED' });
    expect(result.success).toBe(false);
  });

  it('rejects DELETED (should not be settable via API)', () => {
    const result = statusUpdateSchema.safeParse({ status: 'DELETED' });
    expect(result.success).toBe(false);
  });

  it('accepts valid statuses', () => {
    const validStatuses = [
      'DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'MODIFIED',
      'COMPLETED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED',
    ];
    for (const status of validStatuses) {
      const result = statusUpdateSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// PROGRESS UPDATE VALIDATION
// ============================================

describe('progressUpdateSchema', () => {
  it('rejects progress below 0', () => {
    const result = progressUpdateSchema.safeParse({ progress: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects progress above 100', () => {
    const result = progressUpdateSchema.safeParse({ progress: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects non-number progress', () => {
    const result = progressUpdateSchema.safeParse({ progress: 'fifty' });
    expect(result.success).toBe(false);
  });

  it('accepts valid progress 0-100', () => {
    expect(progressUpdateSchema.safeParse({ progress: 0 }).success).toBe(true);
    expect(progressUpdateSchema.safeParse({ progress: 50 }).success).toBe(true);
    expect(progressUpdateSchema.safeParse({ progress: 100 }).success).toBe(true);
  });

  it('accepts optional notes and progressStatus', () => {
    const result = progressUpdateSchema.safeParse({
      progress: 75,
      notes: 'Good progress this week',
      progressStatus: 'IN_PROGRESS',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid progressStatus', () => {
    const result = progressUpdateSchema.safeParse({
      progress: 50,
      progressStatus: 'INVALID',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// RATING VALIDATION
// ============================================

describe('ratingSubmitSchema', () => {
  it('rejects score above 5', () => {
    const result = ratingSubmitSchema.safeParse({ score: 6 });
    expect(result.success).toBe(false);
  });

  it('rejects negative score', () => {
    const result = ratingSubmitSchema.safeParse({ score: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts score 0 (clear rating)', () => {
    const result = ratingSubmitSchema.safeParse({ score: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts score 1-5 with optional comments', () => {
    const result = ratingSubmitSchema.safeParse({
      score: 4,
      comments: 'Great work on this goal',
    });
    expect(result.success).toBe(true);
  });

  it('rejects comments over 2000 chars', () => {
    const result = ratingSubmitSchema.safeParse({
      score: 3,
      comments: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// APPROVE/REJECT VALIDATION
// ============================================

describe('approveRejectSchema', () => {
  it('accepts empty body (comments optional)', () => {
    const result = approveRejectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid comments', () => {
    const result = approveRejectSchema.safeParse({
      managerComments: 'Looks good, approved!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects comments over 2000 chars', () => {
    const result = approveRejectSchema.safeParse({
      managerComments: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// PASSWORD VALIDATION
// ============================================

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('Ab1!').valid).toBe(false);
  });

  it('accepts strong passwords', () => {
    expect(validatePassword('StrongP@ss1').valid).toBe(true);
  });
});
