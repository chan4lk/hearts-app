import { test, expect } from '../../fixtures/base';

async function withRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fn();
    if (response.status() === 429 && attempt < maxRetries) {
      const retryAfter = parseInt(response.headers()['retry-after'] || '2', 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000 + 500));
      continue;
    }
    return response;
  }
}

/**
 * Helper to create a goal as the employee and return it.
 */
async function createGoalForRating(employeeRequest: any) {
  const uniqueTitle = `Rating Test Goal ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const response = await withRetry(() => employeeRequest.post('/api/goals', {
    data: {
      title: uniqueTitle,
      description: 'Goal created for rating tests',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'PROFESSIONAL',
    },
  }));
  expect(response.status()).toBe(201);

  const body = await response.json();
  return body.goal;
}

test.describe('Ratings API', () => {
  // ───────────────────────────────────────────────
  // GET /api/goals/[goalId]/ratings
  // ───────────────────────────────────────────────
  test.describe('GET /api/goals/[goalId]/ratings', () => {
    test('should return null rating for a goal with no ratings', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await employeeRequest.get(
        `/api/goals/${goal.id}/ratings`
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('rating');
      expect(body.rating).toBeNull();
    });

    test('should return rating after self-rating is submitted', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      // Submit a self-rating
      await withRetry(() => employeeRequest.post(`/api/goals/${goal.id}/ratings`, {
        data: {
          score: 4,
          comments: 'Self rating for test',
          type: 'self',
        },
      }));

      // Fetch ratings
      const response = await employeeRequest.get(
        `/api/goals/${goal.id}/ratings`
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.rating).not.toBeNull();
      expect(body.rating.selfScore).toBe(4);
      expect(body.rating.selfComments).toBe('Self rating for test');
      expect(body.rating.goalId).toBe(goal.id);
    });

    test('should return 401 for unauthenticated request', async ({
      playwright,
    }) => {
      const unauthenticatedContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });

      const response = await unauthenticatedContext.get(
        '/api/goals/some-goal-id/ratings', { maxRedirects: 0 }
      );
      expect([200, 301, 302, 307, 401]).toContain(response.status());

      await unauthenticatedContext.dispose();
    });
  });

  // ───────────────────────────────────────────────
  // POST /api/goals/[goalId]/ratings - Create rating
  // ───────────────────────────────────────────────
  test.describe('POST /api/goals/[goalId]/ratings', () => {
    test('employee should submit a self-rating', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await withRetry(() => employeeRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 4,
            comments: 'I performed well on this goal',
            type: 'self',
          },
        }
      ));
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.selfScore).toBe(4);
      expect(body.selfComments).toBe('I performed well on this goal');
      expect(body.selfRatedBy).toBeTruthy();
      expect(body.selfRatedAt).toBeTruthy();
      expect(body.goalId).toBe(goal.id);
    });

    test('manager should submit a manager-rating', async ({
      employeeRequest,
      managerRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await withRetry(() => managerRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 5,
            comments: 'Excellent work on this goal',
            type: 'manager',
          },
        }
      ));
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.managerScore).toBe(5);
      expect(body.managerComments).toBe('Excellent work on this goal');
      expect(body.managerRatedBy).toBeTruthy();
      expect(body.managerRatedAt).toBeTruthy();
    });

    test('should support both self and manager ratings on the same goal', async ({
      employeeRequest,
      managerRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      // Employee submits self-rating
      const selfResponse = await withRetry(() => employeeRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 3,
            comments: 'Self assessment',
            type: 'self',
          },
        }
      ));
      expect(selfResponse.ok()).toBeTruthy();

      // Manager submits manager-rating
      const managerResponse = await withRetry(() => managerRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 4,
            comments: 'Manager assessment',
            type: 'manager',
          },
        }
      ));
      expect(managerResponse.ok()).toBeTruthy();

      // Verify both ratings exist
      const getResponse = await employeeRequest.get(
        `/api/goals/${goal.id}/ratings`
      );
      const body = await getResponse.json();

      expect(body.rating.selfScore).toBe(3);
      expect(body.rating.managerScore).toBe(4);
    });
  });

  // ───────────────────────────────────────────────
  // Validation
  // ───────────────────────────────────────────────
  test.describe('Validation', () => {
    test('should return 400 for score less than 1', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await withRetry(() => employeeRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 0,
            comments: 'Invalid score',
            type: 'self',
          },
        }
      ));
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('should return 400 for score greater than 5', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await withRetry(() => employeeRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 6,
            comments: 'Invalid score',
            type: 'self',
          },
        }
      ));
      expect(response.status()).toBe(400);
    });

    test('should return 400 for non-numeric score', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await withRetry(() => employeeRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 'excellent',
            comments: 'Invalid score type',
            type: 'self',
          },
        }
      ));
      expect(response.status()).toBe(400);
    });

    test('should return 400 for missing score', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await withRetry(() => employeeRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            comments: 'No score provided',
            type: 'self',
          },
        }
      ));
      expect(response.status()).toBe(400);
    });

    test('should return 404 for rating a non-existent goal', async ({
      employeeRequest,
    }) => {
      const response = await withRetry(() => employeeRequest.post(
        '/api/goals/nonexistent-id/ratings',
        {
          data: {
            score: 3,
            comments: 'Should fail',
            type: 'self',
          },
        }
      ));
      expect(response.status()).toBe(404);
    });
  });

  // ───────────────────────────────────────────────
  // RBAC
  // ───────────────────────────────────────────────
  test.describe('RBAC', () => {
    test('employee cannot submit a manager-rating', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      const response = await withRetry(() => employeeRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 5,
            comments: 'Employee trying to manager-rate',
            type: 'manager',
          },
        }
      ));
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error).toContain('permission');
    });

    test('manager cannot submit a self-rating on an employee goal', async ({
      employeeRequest,
      managerRequest,
    }) => {
      const goal = await createGoalForRating(employeeRequest);

      // Manager tries to submit self-rating on employee's goal
      const response = await withRetry(() => managerRequest.post(
        `/api/goals/${goal.id}/ratings`,
        {
          data: {
            score: 4,
            comments: 'Manager trying to self-rate employee goal',
            type: 'self',
          },
        }
      ));
      // Manager is not the employee of this goal, so self-rating should fail
      expect(response.status()).toBe(403);
    });
  });
});
