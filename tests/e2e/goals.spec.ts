import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test.describe('Goals — employee smoke', () => {
  test('can open the Goals page and see tab controls', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/goals');
    await expect(page.getByRole('button', { name: /self-created/i })).toBeVisible({ timeout: 10_000 });
  });

  test('create-goal button opens the form', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/goals');
    await page.getByRole('button', { name: /^new goal$/i }).first().click();
    await expect(page.getByPlaceholder('Goal title').first()).toBeVisible({ timeout: 10_000 });
  });
});
