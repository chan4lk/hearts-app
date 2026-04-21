import { test, expect } from '@playwright/test';
import { USERS, login } from './fixtures';

/**
 * Smoke test: credentials login against seeded users.
 *
 * Requires:
 *   - `npm run prisma:seed` populated admin/manager/employee
 *   - ALLOW_PASSWORD_LOGIN=true (or NODE_ENV !== 'production')
 */
test.describe('Auth smoke', () => {
  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('employee can log in with credentials and land on the dashboard', async ({ page }) => {
    await login(page, 'employee');
    expect(page.url()).toMatch(/\/dashboard/);
  });
});

// Re-export so other specs can import from ./fixtures directly without
// re-writing the login helper (keeps spec files thin).
export { USERS };
