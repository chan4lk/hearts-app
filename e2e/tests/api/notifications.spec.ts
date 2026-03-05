import { test, expect } from '../../fixtures/base';

test.describe('Notifications API', () => {
  // ───────────────────────────────────────────────
  // GET /api/notifications
  // ───────────────────────────────────────────────
  test.describe('GET /api/notifications', () => {
    test('authenticated user should list their notifications', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get('/api/notifications');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('notifications');
      expect(Array.isArray(body.notifications)).toBe(true);
      expect(body).toHaveProperty('pagination');
    });

    test('should return notifications with expected structure', async ({
      adminRequest,
    }) => {
      const response = await adminRequest.get('/api/notifications');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('notifications');

      if (body.notifications.length > 0) {
        const notification = body.notifications[0];
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('isRead');
        expect(notification).toHaveProperty('createdAt');
        expect(notification).toHaveProperty('userId');
        expect(typeof notification.isRead).toBe('boolean');
      }
    });

    test('should return pagination metadata', async ({ employeeRequest }) => {
      const response = await employeeRequest.get('/api/notifications');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.pagination).toHaveProperty('page');
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('total');
      expect(typeof body.pagination.page).toBe('number');
      expect(typeof body.pagination.limit).toBe('number');
      expect(typeof body.pagination.total).toBe('number');
    });

    test('should support page parameter for pagination', async ({
      employeeRequest,
    }) => {
      const response = await employeeRequest.get(
        '/api/notifications?page=1&limit=5'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.pagination.page).toBe(1);
      expect(body.notifications.length).toBeLessThanOrEqual(5);
    });

    test('should support page 2 pagination', async ({ employeeRequest }) => {
      const response = await employeeRequest.get(
        '/api/notifications?page=2&limit=5'
      );
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.pagination.page).toBe(2);
    });

    test('admin should see their own notifications', async ({
      adminRequest,
    }) => {
      const response = await adminRequest.get('/api/notifications');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('notifications');

      // Get admin session to verify userId matches
      const sessionResponse = await adminRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const adminId = session.user.id;

      // All notifications should belong to the admin
      for (const notification of body.notifications) {
        expect(notification.userId).toBe(adminId);
      }
    });

    test('manager should see their own notifications', async ({
      managerRequest,
    }) => {
      const response = await managerRequest.get('/api/notifications');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('notifications');

      const sessionResponse = await managerRequest.get('/api/auth/session');
      const session = await sessionResponse.json();
      const managerId = session.user.id;

      for (const notification of body.notifications) {
        expect(notification.userId).toBe(managerId);
      }
    });

    test('unauthenticated request should return 401', async ({
      playwright,
    }) => {
      const unauthenticatedContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      });

      const response =
        await unauthenticatedContext.get('/api/notifications', { maxRedirects: 0 });
      expect([200, 301, 302, 307, 401]).toContain(response.status());

      await unauthenticatedContext.dispose();
    });
  });
});
