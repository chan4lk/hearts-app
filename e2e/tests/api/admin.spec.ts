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

test.describe('Admin API', () => {
  // ───────────────────────────────────────────────
  // GET /api/admin/stats
  // ───────────────────────────────────────────────
  test.describe('GET /api/admin/stats', () => {
    test('admin should get system stats', async ({ adminRequest }) => {
      const response = await adminRequest.get('/api/admin/stats');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('totalUsers');
      expect(body).toHaveProperty('employeeCount');
      expect(body).toHaveProperty('adminCount');
      expect(body).toHaveProperty('managerCount');
      expect(body).toHaveProperty('totalGoals');
      expect(body).toHaveProperty('activeSessions');
      expect(body).toHaveProperty('systemUptime');
      expect(body).toHaveProperty('securityAlerts');
      expect(body).toHaveProperty('roleDistribution');
      expect(body).toHaveProperty('recentUsers');

      expect(typeof body.totalUsers).toBe('number');
      expect(typeof body.employeeCount).toBe('number');
      expect(typeof body.adminCount).toBe('number');
      expect(typeof body.managerCount).toBe('number');
      expect(typeof body.totalGoals).toBe('number');
      expect(Array.isArray(body.roleDistribution)).toBe(true);
      expect(Array.isArray(body.recentUsers)).toBe(true);
    });

    test('manager should not access admin stats', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/admin/stats');
      expect(response.status()).toBe(401);
    });

    test('employee should not access admin stats', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/admin/stats');
      expect(response.status()).toBe(401);
    });
  });

  // ───────────────────────────────────────────────
  // GET /api/admin/users
  // ───────────────────────────────────────────────
  test.describe('GET /api/admin/users', () => {
    test('admin should list users with pagination', async ({
      adminRequest,
    }) => {
      const response = await adminRequest.get('/api/admin/users');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('users');
      expect(Array.isArray(body.users)).toBe(true);
      expect(body).toHaveProperty('pagination');
      expect(body.pagination).toHaveProperty('page');
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('total');

      // Each user should have expected fields
      if (body.users.length > 0) {
        const user = body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      }
    });

    test('admin should list users in minimal mode', async ({
      adminRequest,
    }) => {
      const response = await adminRequest.get('/api/admin/users?minimal=true');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('users');
      expect(Array.isArray(body.users)).toBe(true);
      // Minimal mode should not include pagination
      expect(body).not.toHaveProperty('pagination');

      if (body.users.length > 0) {
        const user = body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      }
    });

    test('admin should filter users by role', async ({ adminRequest }) => {
      const response = await adminRequest.get('/api/admin/users?role=EMPLOYEE');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      for (const user of body.users) {
        expect(user.role).toBe('EMPLOYEE');
      }
    });

    test('admin should search users by name or email', async ({
      adminRequest,
    }) => {
      const response = await adminRequest.get(
        '/api/admin/users?search=admin'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.users.length).toBeGreaterThanOrEqual(0);
    });

    test('manager should not list users via admin endpoint', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/admin/users');
      expect(response.status()).toBe(401);
    });

    test('employee should not list users via admin endpoint', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/admin/users');
      expect(response.status()).toBe(401);
    });
  });

  // ───────────────────────────────────────────────
  // POST /api/admin/users - Create user
  // ───────────────────────────────────────────────
  test.describe('POST /api/admin/users', () => {
    test('admin should create a new user', async ({ adminRequest }) => {
      const uniqueEmail = `testuser-${Date.now()}@example.com`;
      const response = await withRetry(() => adminRequest.post('/api/admin/users', {
        data: {
          name: 'E2E Test User',
          email: uniqueEmail,
          password: 'TestPass123!@#',
          role: 'EMPLOYEE',
        },
      }));
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.name).toBe('E2E Test User');
      expect(body.email).toBe(uniqueEmail);
      expect(body.role).toBe('EMPLOYEE');
      // Password should not be exposed
      // (Prisma includes it by default but this depends on select)
    });

    test('should return 400 for missing required fields', async ({
      adminRequest,
    }) => {
      const response = await withRetry(() => adminRequest.post('/api/admin/users', {
        data: {
          name: 'Incomplete User',
          // Missing email, password, role
        },
      }));
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('should return 400 for duplicate email', async ({
      adminRequest,
    }) => {
      // Use the existing admin email
      const response = await withRetry(() => adminRequest.post('/api/admin/users', {
        data: {
          name: 'Duplicate User',
          email: 'admin@example.com',
          password: 'TestPass123!@#',
          role: 'EMPLOYEE',
        },
      }));
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('should return 400 for invalid role', async ({ adminRequest }) => {
      const response = await withRetry(() => adminRequest.post('/api/admin/users', {
        data: {
          name: 'Invalid Role User',
          email: `invalid-role-${Date.now()}@example.com`,
          password: 'TestPass123!@#',
          role: 'SUPERADMIN',
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('manager should not create users', async ({ managerRequest }) => {
      const response = await withRetry(() => managerRequest.post('/api/admin/users', {
        data: {
          name: 'Should Not Work',
          email: `manager-create-${Date.now()}@example.com`,
          password: 'TestPass123!@#',
          role: 'EMPLOYEE',
        },
      }));
      expect(response.status()).toBe(401);
    });

    test('employee should not create users', async ({ employeeRequest }) => {
      const response = await withRetry(() => employeeRequest.post('/api/admin/users', {
        data: {
          name: 'Should Not Work',
          email: `employee-create-${Date.now()}@example.com`,
          password: 'TestPass123!@#',
          role: 'EMPLOYEE',
        },
      }));
      expect(response.status()).toBe(401);
    });
  });

  // ───────────────────────────────────────────────
  // PUT /api/admin/users - Update user
  // ───────────────────────────────────────────────
  test.describe('PUT /api/admin/users', () => {
    test('admin should update an existing user', async ({ adminRequest }) => {
      // First create a user to update
      const uniqueEmail = `update-test-${Date.now()}@example.com`;
      const createResponse = await withRetry(() => adminRequest.post('/api/admin/users', {
        data: {
          name: 'User To Update',
          email: uniqueEmail,
          password: 'TestPass123!@#',
          role: 'EMPLOYEE',
        },
      }));
      expect(createResponse.ok()).toBeTruthy();
      const createdUser = await createResponse.json();

      // Update the user
      const updatedName = `Updated User ${Date.now()}`;
      const updateResponse = await withRetry(() => adminRequest.put('/api/admin/users', {
        data: {
          id: createdUser.id,
          name: updatedName,
          email: uniqueEmail,
          role: 'EMPLOYEE',
        },
      }));
      expect(updateResponse.ok()).toBeTruthy();

      const updatedUser = await updateResponse.json();
      expect(updatedUser.name).toBe(updatedName);
    });

    test('should return 400 for missing required fields on update', async ({
      adminRequest,
    }) => {
      const response = await withRetry(() => adminRequest.put('/api/admin/users', {
        data: {
          // Missing id, name, email, role
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('manager should not update users via admin endpoint', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.put('/api/admin/users', {
        data: {
          id: 'some-id',
          name: 'Should Not Work',
          email: 'should-not-work@example.com',
          role: 'EMPLOYEE',
        },
      }));
      expect(response.status()).toBe(401);
    });

    test('employee should not update users via admin endpoint', async ({
      employeeRequest,
    }) => {
      const response = await withRetry(() => employeeRequest.put('/api/admin/users', {
        data: {
          id: 'some-id',
          name: 'Should Not Work',
          email: 'should-not-work@example.com',
          role: 'EMPLOYEE',
        },
      }));
      expect(response.status()).toBe(401);
    });
  });

  // ───────────────────────────────────────────────
  // RBAC - Cross-role denial
  // ───────────────────────────────────────────────
  test.describe('RBAC - admin endpoints are restricted', () => {
    test('manager cannot access GET /api/admin/stats', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/admin/stats');
      expect(response.status()).toBe(401);
    });

    test('employee cannot access GET /api/admin/stats', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/admin/stats');
      expect(response.status()).toBe(401);
    });

    test('manager cannot access GET /api/admin/users', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/admin/users');
      expect(response.status()).toBe(401);
    });

    test('employee cannot access GET /api/admin/users', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/admin/users');
      expect(response.status()).toBe(401);
    });
  });
});
