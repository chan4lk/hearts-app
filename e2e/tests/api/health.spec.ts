import { test, expect } from '../../fixtures/base';

test.describe('GET /api/health', () => {
  test('should return health status with database and environment checks', async ({
    request,
  }) => {
    const response = await request.get('/api/health');
    // Accept both 200 (healthy) and 503 (unhealthy but still responds)
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(['healthy', 'unhealthy']).toContain(body.status);
    expect(body).toHaveProperty('timestamp');

    // Verify checks structure
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('environment');

    // Database check structure
    expect(body.checks.database).toHaveProperty('status');
    expect(body.checks.database).toHaveProperty('message');
    expect(body.checks.database).toHaveProperty('responseTime');
    expect(typeof body.checks.database.responseTime).toBe('number');

    // Environment check structure
    expect(body.checks.environment).toHaveProperty('status');
    expect(body.checks.environment).toHaveProperty('variables');
  });

  test('should return 200 when database is healthy', async ({ request }) => {
    const response = await request.get('/api/health');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.status).toBe('healthy');
      expect(body.checks.database.status).toBe('healthy');
      expect(body.checks.database.message).toBe(
        'Database connection successful'
      );
    }
  });

  test('should be accessible without authentication', async ({
    playwright,
  }) => {
    // Create a request context with no auth
    const unauthenticatedContext = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
    });

    const response = await unauthenticatedContext.get('/api/health');
    // Health endpoint should be accessible without auth
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty('status');

    await unauthenticatedContext.dispose();
  });
});
