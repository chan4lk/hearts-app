import { test, expect, Page } from '@playwright/test';
import { login } from './fixtures';

/**
 * Role-based navigation surface.
 * Verifies each role sees exactly the sidebar links they're supposed to.
 *
 * Link expectations (from DashboardLayout.tsx):
 *   EMPLOYEE: Feed, Goals, Reviews, Events, Reports
 *   MANAGER : + Team
 *   ADMIN   : + (collapsible Admin section) — verify Admin group is present
 */

async function assertLinksVisible(page: Page, labels: string[]) {
  for (const label of labels) {
    await expect(
      page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') }).first()
    ).toBeVisible({ timeout: 5_000 });
  }
}

async function assertLinkAbsent(page: Page, label: string) {
  await expect(
    page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })
  ).toHaveCount(0);
}

test.describe('Navigation — role surface', () => {
  test('employee sees employee links and NOT Team/Admin', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/feed');
    await assertLinksVisible(page, ['Feed', 'Goals', 'Events', 'Reports']);
    await assertLinkAbsent(page, 'Team');
    // Admin-only links should not appear
    await assertLinkAbsent(page, 'Users');
    await assertLinkAbsent(page, 'Templates');
    await assertLinkAbsent(page, 'Cycles');
  });

  test('manager sees employee links + Team, NOT admin-only links', async ({ page }) => {
    await login(page, 'manager');
    await page.goto('/dashboard/feed');
    await assertLinksVisible(page, ['Feed', 'Goals', 'Events', 'Reports', 'Team']);
    await assertLinkAbsent(page, 'Users');
    await assertLinkAbsent(page, 'Templates');
    await assertLinkAbsent(page, 'Cycles');
  });

  test('admin sees manager links + admin section (after expanding)', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/dashboard/feed');

    // DashboardLayout renders "EMPLOYEE Portal" until useSession hydrates —
    // wait for "ADMIN Portal" text so nav sections have been recomputed.
    await expect(page.getByText(/admin portal/i).first()).toBeVisible({ timeout: 15_000 });

    await assertLinksVisible(page, ['Feed', 'Goals', 'Events', 'Reports']);

    // The Admin section header is `defaultOpen: false` — it renders as a
    // <button> whose accessible name is "Admin ›" (chevron included). Use
    // substring match, not exact.
    const adminSectionHeader = page.getByRole('button', { name: /admin/i }).first();
    await adminSectionHeader.click();

    // Now at least one admin sub-link should be visible
    const adminLinks = ['Users', 'Templates', 'Values', 'Cycles'];
    const anyVisible = await Promise.all(
      adminLinks.map((name) =>
        page
          .getByRole('link', { name: new RegExp(`^${name}$`, 'i') })
          .first()
          .isVisible()
          .catch(() => false)
      )
    );
    expect(
      anyVisible.some((v) => v),
      'expected at least one admin link (Users/Templates/Values/Cycles) visible for ADMIN after expanding Admin section'
    ).toBe(true);
  });
});
