import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test.describe('Hearts — recognition flow', () => {
  test('employee can open the Give-a-Heart panel', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/feed');

    // The floating launcher has aria-label="Give a Heart"
    await page.getByRole('button', { name: 'Give a Heart', exact: true }).click();
    await expect(page.getByRole('heading', { name: /give a heart/i })).toBeVisible({ timeout: 5_000 });
  });

  test('heart panel does not list the current user as a possible recipient', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/feed');
    await page.getByRole('button', { name: 'Give a Heart', exact: true }).click();

    // Scope search to the modal root (the backdrop+panel are siblings).
    // The picker won't include the current user — assert 0 hits inside the modal.
    const panel = page.getByRole('heading', { name: /give a heart/i }).locator('xpath=ancestor::*[1]/..');
    await expect(panel.getByText('Employee User', { exact: true })).toHaveCount(0);
  });
});
