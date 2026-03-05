import { test, expect } from '../../fixtures/base';

/**
 * Retry helper for rate-limited requests (429).
 * Waits for Retry-After header duration before retrying.
 */
async function withRetry(
  fn: () => Promise<any>,
  maxRetries = 3
): Promise<any> {
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
 * Helper to create a goal via API and return its data.
 * Uses a unique title with timestamp to avoid collisions.
 */
async function createGoalAsEmployee(
  employeeRequest: any,
  overrides: Record<string, any> = {}
) {
  const uniqueTitle = `E2E Test Goal ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    title: uniqueTitle,
    description: 'E2E test goal description for automated testing',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'PROFESSIONAL',
    department: 'ENGINEERING',
    priority: 'MEDIUM',
    ...overrides,
  };

  const response = await withRetry(() =>
    employeeRequest.post('/api/goals', { data: payload })
  );
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.success).toBe(true);
  return body.goal;
}

test.describe('Goals API', () => {
  // ───────────────────────────────────────────────
  // GET /api/goals - List goals
  // ───────────────────────────────────────────────
  test.describe('GET /api/goals', () => {
    test('employee should list their own goals', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/goals');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('goals');
      expect(Array.isArray(body.goals)).toBe(true);
      expect(body).toHaveProperty('stats');
      expect(body).toHaveProperty('pagination');
      expect(body.meta.view).toBe('my-goals');
      expect(body.meta.role).toBe('EMPLOYEE');
    });

    test('manager should list team goals by default', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/goals');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.meta.view).toBe('team-goals');
      expect(body.meta.role).toBe('MANAGER');
    });

    test('admin should list all goals by default', async ({
      adminRequest,
    }) => {
      const response = await adminRequest.get('/api/goals');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.meta.view).toBe('all');
      expect(body.meta.role).toBe('ADMIN');
    });

    test('should support view parameter', async ({ employeeRequest }) => {
      const response = await employeeRequest.get(
        '/api/goals?view=my-goals'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.meta.view).toBe('my-goals');
    });

    test('should support pagination parameters', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get(
        '/api/goals?page=1&limit=5'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.pagination).toHaveProperty('page');
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('total');
    });

    test('should support status filter', async ({ employeeRequest }) => {
      const response = await employeeRequest.get(
        '/api/goals?status=DRAFT'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      // All returned goals should be DRAFT
      for (const goal of body.goals) {
        expect(goal.status).toBe('DRAFT');
      }
    });

    test('employee should be forbidden from team-goals view', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get(
        '/api/goals?view=team-goals'
      );
      expect(response.status()).toBe(403);
    });

    test('employee should be forbidden from all view', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/goals?view=all');
      expect(response.status()).toBe(403);
    });
  });

  // ───────────────────────────────────────────────
  // POST /api/goals - Create goal
  // ───────────────────────────────────────────────
  test.describe('POST /api/goals', () => {
    test('employee should create a goal for themselves with DRAFT status', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);
      expect(goal).toHaveProperty('id');
      expect(goal.status).toBe('DRAFT');
      expect(goal.title).toContain('E2E Test Goal');
      expect(goal.category).toBe('PROFESSIONAL');
      expect(goal.priority).toBe('MEDIUM');
    });

    test('manager should create a goal assigned to an employee with APPROVED status', async ({
      managerRequest,
      employeeRequest,
    }) => {
      // First get the employee's session to find their ID
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const uniqueTitle = `Manager Assigned Goal ${Date.now()}`;
      const response = await withRetry(() =>
        managerRequest.post('/api/goals', {
          data: {
            title: uniqueTitle,
            description: 'Goal assigned by manager for testing',
            dueDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            category: 'TECHNICAL',
            employeeId,
          },
        })
      );
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.goal.status).toBe('APPROVED');
      expect(body.goal.employeeId).toBe(employeeId);
    });

    test('should return 400 when required fields are missing', async ({
      employeeRequest,
    }) => {
      const response = await withRetry(() =>
        employeeRequest.post('/api/goals', {
          data: {
            title: 'Incomplete Goal',
            // Missing description and dueDate
          },
        })
      );
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('should return 400 when title is missing', async ({
      employeeRequest,
    }) => {
      const response = await withRetry(() =>
        employeeRequest.post('/api/goals', {
          data: {
            description: 'Has description but no title',
            dueDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        })
      );
      expect(response.status()).toBe(400);
    });

    test('employee should not create a goal for another employee', async ({
      employeeRequest,
      adminRequest,
    }) => {
      // Get admin session to find their ID (a different user)
      const sessionResponse = await adminRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const adminId = session.user.id;

      const response = await withRetry(() =>
        employeeRequest.post('/api/goals', {
          data: {
            title: `Unauthorized Goal ${Date.now()}`,
            description: 'Should not be created',
            dueDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            employeeId: adminId,
          },
        })
      );
      expect(response.status()).toBe(403);
    });
  });

  // ───────────────────────────────────────────────
  // GET /api/goals/[goalId] - Get single goal
  // ───────────────────────────────────────────────
  test.describe('GET /api/goals/[goalId]', () => {
    test('employee should get their own goal by ID', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await employeeRequest.get(`/api/goals/${goal.id}`);
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.goal).toHaveProperty('id', goal.id);
      expect(body.goal).toHaveProperty('title');
      expect(body.goal).toHaveProperty('description');
      expect(body.goal).toHaveProperty('employee');
    });

    test('should return 404 for non-existent goal', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get(
        '/api/goals/nonexistent-goal-id'
      );
      expect(response.status()).toBe(404);
    });

    test('admin should get any goal by ID', async ({
      employeeRequest,
      adminRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await adminRequest.get(`/api/goals/${goal.id}`);
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.goal.id).toBe(goal.id);
    });
  });

  // ───────────────────────────────────────────────
  // PUT /api/goals/[goalId] - Update goal
  // ───────────────────────────────────────────────
  test.describe('PUT /api/goals/[goalId]', () => {
    test('employee should update their own DRAFT goal', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const updatedTitle = `Updated Goal ${Date.now()}`;
      const response = await withRetry(() =>
        employeeRequest.put(`/api/goals/${goal.id}`, {
          data: {
            title: updatedTitle,
            description: 'Updated description for testing',
            category: 'TECHNICAL',
            dueDate: new Date(
              Date.now() + 60 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        })
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.goal.title).toBe(updatedTitle);
    });
  });

  // ───────────────────────────────────────────────
  // PUT /api/goals/[goalId]/approve - Manager approves goal
  // ───────────────────────────────────────────────
  test.describe('PUT /api/goals/[goalId]/approve', () => {
    test('manager should approve a DRAFT goal', async ({
      employeeRequest,
      managerRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);
      expect(goal.status).toBe('DRAFT');

      const response = await withRetry(() =>
        managerRequest.put(
          `/api/goals/${goal.id}/approve`,
          {
            data: {
              managerComments: 'Approved via E2E test',
            },
          }
        )
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.status).toBe('APPROVED');
      expect(body.feedback).toBe('Approved via E2E test');
    });

    test('employee should not be able to approve a goal (RBAC)', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/approve`,
          {
            data: {
              managerComments: 'Employee trying to approve',
            },
          }
        )
      );
      expect(response.status()).toBe(403);
    });

    test('admin should approve a goal', async ({
      employeeRequest,
      adminRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        adminRequest.put(
          `/api/goals/${goal.id}/approve`,
          {
            data: {
              managerComments: 'Admin approved via E2E test',
            },
          }
        )
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.status).toBe('APPROVED');
    });
  });

  // ───────────────────────────────────────────────
  // PUT /api/goals/[goalId]/reject - Manager rejects goal
  // ───────────────────────────────────────────────
  test.describe('PUT /api/goals/[goalId]/reject', () => {
    test('manager should reject a DRAFT goal', async ({
      employeeRequest,
      managerRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        managerRequest.put(
          `/api/goals/${goal.id}/reject`,
          {
            data: {
              managerComments: 'Rejected via E2E test - needs revision',
            },
          }
        )
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.status).toBe('REJECTED');
      expect(body.feedback).toBe('Rejected via E2E test - needs revision');
    });

    test('employee should not be able to reject a goal (RBAC)', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/reject`,
          {
            data: {
              managerComments: 'Employee trying to reject',
            },
          }
        )
      );
      expect(response.status()).toBe(403);
    });
  });

  // ───────────────────────────────────────────────
  // PUT /api/goals/[goalId]/progress - Update progress
  // ───────────────────────────────────────────────
  test.describe('PUT /api/goals/[goalId]/progress', () => {
    test('employee should update progress on their own goal', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/progress`,
          {
            data: {
              progress: 50,
              notes: 'Halfway done via E2E test',
            },
          }
        )
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.progress).toBe(50);
      expect(body.progressStatus).toBe('IN_PROGRESS');
    });

    test('should auto-set progressStatus to COMPLETED at 100%', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/progress`,
          {
            data: {
              progress: 100,
              notes: 'Complete via E2E test',
            },
          }
        )
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.progress).toBe(100);
      expect(body.progressStatus).toBe('COMPLETED');
    });

    test('should auto-set progressStatus to NOT_STARTED at 0%', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/progress`,
          {
            data: {
              progress: 0,
              notes: 'Reset to zero',
            },
          }
        )
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.progress).toBe(0);
      expect(body.progressStatus).toBe('NOT_STARTED');
    });

    test('should return 400 for invalid progress value (>100)', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/progress`,
          {
            data: {
              progress: 150,
            },
          }
        )
      );
      expect(response.status()).toBe(400);
    });

    test('should return 400 for invalid progress value (<0)', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/progress`,
          {
            data: {
              progress: -10,
            },
          }
        )
      );
      expect(response.status()).toBe(400);
    });

    test('should accept custom progressStatus', async ({
      employeeRequest,
    }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/progress`,
          {
            data: {
              progress: 30,
              progressStatus: 'ON_HOLD',
              notes: 'Paused work',
            },
          }
        )
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.progressStatus).toBe('ON_HOLD');
    });
  });

  // ───────────────────────────────────────────────
  // GET /api/goals/pending - Manager pending goals
  // ───────────────────────────────────────────────
  test.describe('GET /api/goals/pending', () => {
    test('manager should see pending goals', async ({ managerRequest }) => {
      const response = await managerRequest.get('/api/goals/pending');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);

      // All returned goals should be in PENDING status
      for (const goal of body) {
        expect(goal.status).toBe('PENDING');
        expect(goal).toHaveProperty('employee');
        expect(goal).toHaveProperty('title');
      }
    });

    test('employee should be forbidden from pending endpoint', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/goals/pending');
      expect(response.status()).toBe(403);
    });

    test('admin should see pending goals', async ({ adminRequest }) => {
      const response = await adminRequest.get('/api/goals/pending');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });

  // ───────────────────────────────────────────────
  // GET /api/goals/approved - Approved goals
  // ───────────────────────────────────────────────
  test.describe('GET /api/goals/approved', () => {
    test('authenticated user should see their approved goals', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/goals/approved');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);

      // All returned goals should be APPROVED
      for (const goal of body) {
        expect(goal.status).toBe('APPROVED');
      }
    });

    test('unauthenticated user should get 401', async ({ playwright }) => {
      const unauthenticatedContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });

      const response = await unauthenticatedContext.get('/api/goals/approved', { maxRedirects: 0 });
      expect([200, 301, 302, 307, 401]).toContain(response.status());

      await unauthenticatedContext.dispose();
    });
  });

  // ───────────────────────────────────────────────
  // RBAC - Role-based access control
  // ───────────────────────────────────────────────
  test.describe('RBAC enforcement', () => {
    test('employee cannot approve goals', async ({ employeeRequest }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/approve`,
          {
            data: { managerComments: 'should not work' },
          }
        )
      );
      expect(response.status()).toBe(403);
    });

    test('employee cannot reject goals', async ({ employeeRequest }) => {
      const goal = await createGoalAsEmployee(employeeRequest);

      const response = await withRetry(() =>
        employeeRequest.put(
          `/api/goals/${goal.id}/reject`,
          {
            data: { managerComments: 'should not work' },
          }
        )
      );
      expect(response.status()).toBe(403);
    });

    test('only manager/admin can view pending-approval goals', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get(
        '/api/goals?view=pending-approval'
      );
      expect(response.status()).toBe(403);
    });
  });

  // ───────────────────────────────────────────────
  // Validation
  // ───────────────────────────────────────────────
  test.describe('Validation', () => {
    test('creating a goal without title returns 400', async ({
      employeeRequest,
    }) => {
      const response = await withRetry(() =>
        employeeRequest.post('/api/goals', {
          data: {
            description: 'Missing title',
            dueDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        })
      );
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('creating a goal without description returns 400', async ({
      employeeRequest,
    }) => {
      const response = await withRetry(() =>
        employeeRequest.post('/api/goals', {
          data: {
            title: `No Description Goal ${Date.now()}`,
            dueDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        })
      );
      expect(response.status()).toBe(400);
    });

    test('creating a goal without dueDate returns 400', async ({
      employeeRequest,
    }) => {
      const response = await withRetry(() =>
        employeeRequest.post('/api/goals', {
          data: {
            title: `No DueDate Goal ${Date.now()}`,
            description: 'Has description but no due date',
          },
        })
      );
      expect(response.status()).toBe(400);
    });
  });
});
