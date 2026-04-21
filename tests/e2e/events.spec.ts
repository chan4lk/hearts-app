import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test.describe('Events — employee RSVP', () => {
  test('employee sees seeded events on the events page', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/events');
    await expect(page.getByText(/toastmasters|codecrunch|hearts talk/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('admin can open the event-create flow', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/dashboard/admin/events');
    await expect(page.getByRole('button', { name: /new event|add event|create event/i }).first()).toBeVisible({ timeout: 10_000 });
  });
});
