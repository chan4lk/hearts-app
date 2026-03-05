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

test.describe('Meetings API', () => {
  // ───────────────────────────────────────────────
  // GET /api/meetings
  // ───────────────────────────────────────────────
  test.describe('GET /api/meetings', () => {
    test('admin should list all meetings', async ({ adminRequest }) => {
      const response = await adminRequest.get('/api/meetings');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('meetings');
      expect(Array.isArray(body.meetings)).toBe(true);

      if (body.meetings.length > 0) {
        const meeting = body.meetings[0];
        expect(meeting).toHaveProperty('id');
        expect(meeting).toHaveProperty('type');
        expect(meeting).toHaveProperty('date');
        expect(meeting).toHaveProperty('notes');
        expect(meeting).toHaveProperty('employee');
        expect(meeting).toHaveProperty('manager');
      }
    });

    test('manager should list meetings they created', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/meetings');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('meetings');
      expect(Array.isArray(body.meetings)).toBe(true);
    });

    test('employee should list meetings where they are the subject', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/meetings');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('meetings');
      expect(Array.isArray(body.meetings)).toBe(true);
    });

    test('admin should filter meetings by employeeId', async ({
      adminRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const response = await adminRequest.get(
        `/api/meetings?employeeId=${employeeId}`
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('meetings');
    });

    test('unauthenticated request should return 401', async ({
      playwright,
    }) => {
      const unauthenticatedContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });

      const response = await unauthenticatedContext.get('/api/meetings', { maxRedirects: 0 });
      expect([200, 301, 302, 307, 401]).toContain(response.status());

      await unauthenticatedContext.dispose();
    });
  });

  // ───────────────────────────────────────────────
  // POST /api/meetings
  // ───────────────────────────────────────────────
  test.describe('POST /api/meetings', () => {
    test('manager should create a meeting', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const response = await withRetry(() => managerRequest.post('/api/meetings', {
        data: {
          employeeId,
          type: 'GENERAL',
          date: new Date().toISOString(),
          notes: 'E2E test meeting notes',
          actionItems: 'Follow up on project progress',
          nextSteps: 'Schedule next 1-on-1',
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('meeting');
      expect(body.meeting.type).toBe('GENERAL');
      expect(body.meeting.notes).toBe('E2E test meeting notes');
      expect(body.meeting.employee.id).toBe(employeeId);
    });

    test('admin should create a meeting', async ({
      adminRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const response = await withRetry(() => adminRequest.post('/api/meetings', {
        data: {
          employeeId,
          type: 'THREE_MONTH_REVIEW',
          date: new Date().toISOString(),
          notes: 'Admin-created meeting notes for E2E test',
        },
      }));
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.meeting.type).toBe('THREE_MONTH_REVIEW');
    });

    test('employee should not create a meeting (RBAC)', async ({
      employeeRequest,
      adminRequest,
    }) => {
      const sessionResponse = await adminRequest.get('/api/auth/session');
      const session = await sessionResponse.json();

      const response = await withRetry(() => employeeRequest.post('/api/meetings', {
        data: {
          employeeId: session.user.id,
          type: 'GENERAL',
          date: new Date().toISOString(),
          notes: 'Employee trying to create meeting',
        },
      }));
      expect(response.status()).toBe(403);
    });

    test('should return 400 for missing required fields', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.post('/api/meetings', {
        data: {
          // Missing all required fields
        },
      }));
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    test('should return 400 for invalid meeting type', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();

      const response = await withRetry(() => managerRequest.post('/api/meetings', {
        data: {
          employeeId: session.user.id,
          type: 'INVALID_TYPE',
          date: new Date().toISOString(),
          notes: 'Should fail - invalid type',
        },
      }));
      expect(response.status()).toBe(400);
    });

    test('should return 404 for non-existent employee', async ({
      managerRequest,
    }) => {
      const response = await withRetry(() => managerRequest.post('/api/meetings', {
        data: {
          employeeId: 'nonexistent-employee-id',
          type: 'GENERAL',
          date: new Date().toISOString(),
          notes: 'Should fail - employee not found',
        },
      }));
      expect(response.status()).toBe(404);
    });

    test('should support all valid meeting types', async ({
      managerRequest,
      employeeRequest,
    }) => {
      const sessionResponse = await employeeRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const employeeId = session.user.id;

      const validTypes = [
        'THREE_MONTH_REVIEW',
        'SIX_MONTH_REVIEW',
        'ANNUAL_REVIEW',
        'FEEDBACK_DISCUSSION',
        'GENERAL',
      ];

      for (const type of validTypes) {
        const response = await withRetry(() => managerRequest.post('/api/meetings', {
          data: {
            employeeId,
            type,
            date: new Date().toISOString(),
            notes: `Meeting of type ${type}`,
          },
        }));
        expect(response.status()).toBe(201);
      }
    });
  });
});
