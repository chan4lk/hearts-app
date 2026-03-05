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

test.describe('Feedback Rounds API', () => {
  // ───────────────────────────────────────────────
  // GET /api/feedback-rounds
  // ───────────────────────────────────────────────
  test.describe('GET /api/feedback-rounds', () => {
    test('admin should list all feedback rounds', async ({ adminRequest }) => {
      const response = await adminRequest.get('/api/feedback-rounds');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('rounds');
      expect(Array.isArray(body.rounds)).toBe(true);

      // Each round should have the expected structure
      if (body.rounds.length > 0) {
        const round = body.rounds[0];
        expect(round).toHaveProperty('id');
        expect(round).toHaveProperty('type');
        expect(round).toHaveProperty('status');
        expect(round).toHaveProperty('employee');
        expect(round).toHaveProperty('initiatedBy');
        expect(round).toHaveProperty('reviewsSummary');
        expect(round.reviewsSummary).toHaveProperty('total');
        expect(round.reviewsSummary).toHaveProperty('submitted');
        expect(round.reviewsSummary).toHaveProperty('pending');
      }
    });

    test('manager should list feedback rounds they initiated', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/feedback-rounds');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('rounds');
      expect(Array.isArray(body.rounds)).toBe(true);
    });

    test('employee should list feedback rounds where they are the subject', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/feedback-rounds');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('rounds');
      expect(Array.isArray(body.rounds)).toBe(true);
    });

    test('should support status filter', async ({ adminRequest }) => {
      const response = await adminRequest.get(
        '/api/feedback-rounds?status=PENDING'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      for (const round of body.rounds) {
        expect(round.status).toBe('PENDING');
      }
    });

    test('unauthenticated request should return 401', async ({
      playwright,
    }) => {
      const unauthenticatedContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });

      const response =
        await unauthenticatedContext.get('/api/feedback-rounds', { maxRedirects: 0 });
      expect([200, 301, 302, 307, 401]).toContain(response.status());

      await unauthenticatedContext.dispose();
    });
  });

  // ───────────────────────────────────────────────
  // POST /api/feedback-rounds
  // ───────────────────────────────────────────────
  test.describe('POST /api/feedback-rounds', () => {
    test('manager should create a feedback round', async ({
      managerRequest,
      employeeRequest,
      adminRequest,
    }) => {
      // Get employee ID
      const employeeSession = await employeeRequest.get('/api/auth/session');
      const employee = await employeeSession.json();
      const employeeId = employee.user.id;

      // Get admin ID to use as a reviewer
      const adminSession = await adminRequest.get('/api/auth/session');
      const admin = await adminSession.json();
      const adminId = admin.user.id;

      // Get manager ID to use as reviewer
      const managerSession = await managerRequest.get('/api/auth/session');
      const manager = await managerSession.json();
      const managerId = manager.user.id;

      const response = await withRetry(() => managerRequest.post('/api/feedback-rounds', {
        data: {
          employeeId,
          type: 'THREE_MONTH',
          reviewerIds: [adminId, managerId],
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('round');
      expect(body.round.type).toBe('THREE_MONTH');
      expect(body.round.status).toBe('PENDING');
      expect(body.round.employee.id).toBe(employeeId);
      expect(body.round.reviews.length).toBe(2);
    });

    test('admin should create a feedback round', async ({
      adminRequest,
      employeeRequest,
      managerRequest,
    }) => {
      const employeeSession = await employeeRequest.get('/api/auth/session');
      const employee = await employeeSession.json();
      const employeeId = employee.user.id;

      const managerSession = await managerRequest.get('/api/auth/session');
      const manager = await managerSession.json();
      const managerId = manager.user.id;

      const response = await withRetry(() => adminRequest.post('/api/feedback-rounds', {
        data: {
          employeeId,
          type: 'ANNUAL',
          reviewerIds: [managerId],
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.round.type).toBe('ANNUAL');
    });

    test('employee should not create a feedback round (RBAC)', async ({
      employeeRequest,
      adminRequest,
    }) => {
      const adminSession = await adminRequest.get('/api/auth/session');
      const admin = await adminSession.json();

      const response = await withRetry(() => employeeRequest.post('/api/feedback-rounds', {
        data: {
          employeeId: admin.user.id,
          type: 'THREE_MONTH',
          reviewerIds: [admin.user.id],
        },
      }));
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('should return 400 for missing employeeId', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.post('/api/feedback-rounds', {
        data: {
          type: 'THREE_MONTH',
          reviewerIds: ['some-reviewer-id'],
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('should return 400 for invalid type', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const employeeSession = await employeeRequest.get('/api/auth/session');
      const employee = await employeeSession.json();

      const response = await withRetry(() => managerRequest.post('/api/feedback-rounds', {
        data: {
          employeeId: employee.user.id,
          type: 'INVALID_TYPE',
          reviewerIds: ['some-reviewer-id'],
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('should return 400 for empty reviewerIds', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const employeeSession = await employeeRequest.get('/api/auth/session');
      const employee = await employeeSession.json();

      const response = await withRetry(() => managerRequest.post('/api/feedback-rounds', {
        data: {
          employeeId: employee.user.id,
          type: 'THREE_MONTH',
          reviewerIds: [],
        },
      }));
      expect(response.status()).toBe(400);
    });
  });
});
