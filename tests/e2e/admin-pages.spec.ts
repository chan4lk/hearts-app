import { test, expect } from '@playwright/test';
import { login } from './fixtures';

/**
 * Smoke each admin page loads with expected heading + primary action
 * (where one exists). Doesn't exercise CRUD — just catches 500s, render
 * errors, RBAC regressions.
 */

test.describe('Admin — page smokes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('Templates — heading + "New Template" button', async ({ page }) => {
    await page.goto('/dashboard/admin/templates');
    await expect(page.getByRole('heading', { name: /goal templates/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /^new template$/i })).toBeVisible();
  });

  test('Values — heading + "New Value" button', async ({ page }) => {
    await page.goto('/dashboard/admin/values');
    await expect(page.getByRole('heading', { name: /company values/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /^new value$/i })).toBeVisible();
  });

  test('Cycles — heading + "New Cycle" button', async ({ page }) => {
    await page.goto('/dashboard/admin/cycles');
    await expect(page.getByRole('heading', { name: /review cycles/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /^new cycle$/i })).toBeVisible();
  });

  test('Events — heading + "New Event" button', async ({ page }) => {
    await page.goto('/dashboard/admin/events');
    await expect(page.getByRole('heading', { name: /^events$/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /^new event$/i })).toBeVisible();
  });

  test('Users — page renders without error', async ({ page }) => {
    // The Users page cold-compiles a heavy dep chain (lib/badges → logger →
    // applicationinsights). On the Next.js DEV server this is flaky — the
    // page sometimes blanks out mid-render under load. We smoke it by
    // asserting the heading + one characteristic control. The full data
    // render is covered by the /api/admin/users route test at the unit layer.
    test.setTimeout(120_000);
    await page.goto('/dashboard/admin/users', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(page.getByRole('heading', { name: /user management/i }))
      .toBeVisible({ timeout: 45_000 });
    // The Import button is always rendered in the page header actions
    await expect(page.getByRole('button', { name: /^export$/i }).or(page.locator('label', { hasText: /^import$/i })).first())
      .toBeVisible({ timeout: 15_000 });
  });

  test('Notifications — heading renders', async ({ page }) => {
    await page.goto('/dashboard/admin/notifications');
    await expect(page.getByRole('heading', { name: /email notifications/i })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Admin — RBAC guard', () => {
  test('employee visiting /dashboard/admin/users does not see admin content', async ({ page }) => {
    await login(page, 'employee');
    const res = await page.goto('/dashboard/admin/users');
    // Either redirect to a non-admin page OR render a 403 state.
    // We assert the User Management heading is NOT present.
    await expect(page.getByRole('heading', { name: /user management/i })).toHaveCount(0);
    // If the server returned 200, we should have been redirected off the admin area.
    if (res && res.status() === 200) {
      expect(page.url()).not.toMatch(/\/dashboard\/admin\//);
    }
  });
});
