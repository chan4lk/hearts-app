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

test.describe('Exit Interviews API', () => {
  // ───────────────────────────────────────────────
  // GET /api/exit-interviews
  // ───────────────────────────────────────────────
  test.describe('GET /api/exit-interviews', () => {
    test('admin should list all exit interviews', async ({ adminRequest }) => {
      const response = await adminRequest.get('/api/exit-interviews');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('exitInterviews');
      expect(Array.isArray(body.exitInterviews)).toBe(true);

      if (body.exitInterviews.length > 0) {
        const interview = body.exitInterviews[0];
        expect(interview).toHaveProperty('id');
        expect(interview).toHaveProperty('status');
        expect(interview).toHaveProperty('departureDate');
        expect(interview).toHaveProperty('employee');
        expect(interview).toHaveProperty('manager');
      }
    });

    test('manager should list exit interviews they created', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/exit-interviews');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('exitInterviews');
      expect(Array.isArray(body.exitInterviews)).toBe(true);
    });

    test('employee should list exit interviews where they are the subject', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/exit-interviews');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('exitInterviews');
      expect(Array.isArray(body.exitInterviews)).toBe(true);
    });

    test('should support status filter', async ({ adminRequest }) => {
      const response = await adminRequest.get(
        '/api/exit-interviews?status=PENDING'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      for (const interview of body.exitInterviews) {
        expect(interview.status).toBe('PENDING');
      }
    });

    test('unauthenticated request should return 401', async ({
      playwright,
    }) => {
      const unauthenticatedContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });

      const response =
        await unauthenticatedContext.get('/api/exit-interviews', { maxRedirects: 0 });
      expect([200, 301, 302, 307, 401]).toContain(response.status());

      await unauthenticatedContext.dispose();
    });
  });

  // ───────────────────────────────────────────────
  // POST /api/exit-interviews
  // ───────────────────────────────────────────────
  test.describe('POST /api/exit-interviews', () => {
    test('manager should create an exit interview', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const departureDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await withRetry(() => managerRequest.post('/api/exit-interviews', {
        data: {
          employeeId,
          departureDate,
          reason: 'E2E test - career growth',
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('exitInterview');
      expect(body.exitInterview.status).toBe('PENDING');
      expect(body.exitInterview.employee.id).toBe(employeeId);
      expect(body.exitInterview.reason).toBe('E2E test - career growth');
    });

    test('admin should create an exit interview', async ({
      adminRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const departureDate = new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await withRetry(() => adminRequest.post('/api/exit-interviews', {
        data: {
          employeeId,
          departureDate,
          reason: 'Admin created exit interview for E2E test',
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.exitInterview.status).toBe('PENDING');
    });

    test('employee should not create an exit interview (RBAC)', async ({
      employeeRequest,
      adminRequest,
    }) => {
      const sessionResponse = await adminRequest.get('/api/auth/session');
      const session = await sessionResponse.json();

      const response = await withRetry(() => employeeRequest.post('/api/exit-interviews', {
        data: {
          employeeId: session.user.id,
          departureDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          reason: 'Employee trying to create exit interview',
        },
      }));
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('should return 400 for missing employeeId', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.post('/api/exit-interviews', {
        data: {
          departureDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          reason: 'Missing employee ID',
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('should return 400 for missing departureDate', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();

      const response = await withRetry(() => managerRequest.post('/api/exit-interviews', {
        data: {
          employeeId: session.user.id,
          reason: 'Missing departure date',
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('should return 404 for non-existent employee', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.post('/api/exit-interviews', {
        data: {
          employeeId: 'nonexistent-employee-id',
          departureDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          reason: 'Should fail - employee not found',
        },
      }));
      expect(response.status()).toBe(404);
    });

    test('should create exit interview without reason (optional field)', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const response = await withRetry(() => managerRequest.post('/api/exit-interviews', {
        data: {
          employeeId,
          departureDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          // No reason provided
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.exitInterview.reason).toBeNull();
    });
  });
});
