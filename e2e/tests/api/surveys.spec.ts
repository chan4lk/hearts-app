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

test.describe('Surveys API', () => {
  // ───────────────────────────────────────────────
  // GET /api/surveys
  // ───────────────────────────────────────────────
  test.describe('GET /api/surveys', () => {
    test('admin should list all surveys', async ({ adminRequest }) => {
      const response = await adminRequest.get('/api/surveys');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('surveys');
      expect(Array.isArray(body.surveys)).toBe(true);

      if (body.surveys.length > 0) {
        const survey = body.surveys[0];
        expect(survey).toHaveProperty('id');
        expect(survey).toHaveProperty('type');
        expect(survey).toHaveProperty('status');
        expect(survey).toHaveProperty('employee');
      }
    });

    test('manager should list surveys', async ({ managerRequest }) => {
      const response = await managerRequest.get('/api/surveys');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('surveys');
      expect(Array.isArray(body.surveys)).toBe(true);
    });

    test('employee should list only their own surveys', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/surveys');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('surveys');
      expect(Array.isArray(body.surveys)).toBe(true);
    });

    test('admin should filter surveys by employeeId', async ({
      adminRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const response = await adminRequest.get(
        `/api/surveys?employeeId=${employeeId}`
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('surveys');
    });

    test('unauthenticated request should return 401', async ({
      playwright,
    }) => {
      const unauthenticatedContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });

      const response = await unauthenticatedContext.get('/api/surveys', { maxRedirects: 0 });
      expect([200, 301, 302, 307, 401]).toContain(response.status());

      await unauthenticatedContext.dispose();
    });
  });

  // ───────────────────────────────────────────────
  // POST /api/surveys
  // ───────────────────────────────────────────────
  test.describe('POST /api/surveys', () => {
    test('manager should create a survey', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const response = await withRetry(() => managerRequest.post('/api/surveys', {
        data: {
          employeeId,
          type: 'NEW_JOINER_FEEDBACK',
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('survey');
      expect(body.survey.type).toBe('NEW_JOINER_FEEDBACK');
      expect(body.survey.status).toBe('PENDING');
      expect(body.survey.employee.id).toBe(employeeId);
    });

    test('admin should create a survey', async ({
      adminRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const response = await withRetry(() => adminRequest.post('/api/surveys', {
        data: {
          employeeId,
          type: 'NEW_JOINER_FEEDBACK',
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.survey.type).toBe('NEW_JOINER_FEEDBACK');
    });

    test('employee should not create a survey (RBAC)', async ({
      employeeRequest,
      adminRequest,
    }) => {
      const sessionResponse = await adminRequest.get('/api/auth/session');
      const session = await sessionResponse.json();

      const response = await withRetry(() => employeeRequest.post('/api/surveys', {
        data: {
          employeeId: session.user.id,
          type: 'NEW_JOINER_FEEDBACK',
        },
      }));
      expect(response.status()).toBe(403);
    });

    test('should return 400 for missing required fields', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.post('/api/surveys', {
        data: {
          // Missing employeeId and type
        },
      }));
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('should return 400 for invalid survey type', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();

      const response = await withRetry(() => managerRequest.post('/api/surveys', {
        data: {
          employeeId: session.user.id,
          type: 'INVALID_TYPE',
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('should return 404 for non-existent employee', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.post('/api/surveys', {
        data: {
          employeeId: 'nonexistent-employee-id',
          type: 'NEW_JOINER_FEEDBACK',
        },
      }));
      expect(response.status()).toBe(404);
    });
  });
});
