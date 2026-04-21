import { test, expect, Page } from '@playwright/test';
import { login, logout } from './fixtures';

/**
 * Full approval-cycle flow:
 *   employee creates DRAFT → Submit (→ PENDING) →
 *   manager Approve (→ ACTIVE) → employee progress 100% + Complete (→ COMPLETED).
 *
 * Serial suite — each test depends on the previous step's DB state.
 * Requires: seeded DB (`npm run prisma:seed`).
 */
test.describe.configure({ mode: 'serial' });

const GOAL_TITLE = `E2E Goal ${Date.now()}`;

const cardFor = (page: Page, title: string) =>
  page.locator('.card-interactive', { hasText: title }).first();

/** Wait for and assert the bulk-create API actually succeeded. */
async function submitGoalCreate(page: Page) {
  const pending = page.waitForResponse(
    (r) => r.url().includes('/api/goals/bulk') && r.request().method() === 'POST',
    { timeout: 15_000 }
  );
  await page.getByRole('button', { name: /^create \d+ goal/i }).click();
  const res = await pending;
  if (!res.ok()) {
    throw new Error(`/api/goals/bulk returned ${res.status()} — ${await res.text()}`);
  }
}

test.describe('Goal approval cycle — employee → manager → badge', () => {
  test('employee creates a goal and submits it for approval', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/goals');

    await page.getByRole('button', { name: /^new goal$/i }).first().click();

    const titleInput = page.getByPlaceholder('Goal title').first();
    await titleInput.fill(GOAL_TITLE);
    await expect(titleInput).toHaveValue(GOAL_TITLE);

    const descInput = page.getByPlaceholder(/description/i).first();
    await descInput.fill('Created by E2E test');

    await submitGoalCreate(page);

    // Card appears in Self-Created tab
    await expect(cardFor(page, GOAL_TITLE)).toBeVisible({ timeout: 10_000 });

    // Submit for approval — wait for the PATCH to complete
    const patched = page.waitForResponse(
      (r) => r.url().includes('/api/goals/') && r.request().method() === 'PATCH',
      { timeout: 10_000 }
    );
    await cardFor(page, GOAL_TITLE).getByRole('button', { name: /^submit$/i }).click();
    await patched;

    await expect(cardFor(page, GOAL_TITLE).getByText(/pending/i)).toBeVisible({ timeout: 10_000 });
  });

  test('manager sees the pending goal in Team tab and approves it', async ({ page }) => {
    await logout(page);
    await login(page, 'manager');
    await page.goto('/dashboard/goals');

    await page.getByRole('button', { name: /^team goals$/i }).click();

    await expect(cardFor(page, GOAL_TITLE)).toBeVisible({ timeout: 10_000 });

    // Approve is POST /api/goals/:id/approve
    const approved = page.waitForResponse(
      (r) => /\/api\/goals\/[^/]+\/approve$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 10_000 }
    );
    await cardFor(page, GOAL_TITLE).getByRole('button', { name: /^approve$/i }).click();
    await approved;

    await expect(cardFor(page, GOAL_TITLE).getByText(/active/i)).toBeVisible({ timeout: 10_000 });
  });

  test('employee sets progress to 100 and marks the goal complete', async ({ page }) => {
    await logout(page);
    await login(page, 'employee');
    await page.goto('/dashboard/goals');

    const card = cardFor(page, GOAL_TITLE);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Drive the range to 100 via End key + fire the commit event
    const slider = card.getByRole('slider').first();
    await slider.focus();
    await page.keyboard.press('End');
    await slider.evaluate((el: HTMLInputElement) => {
      el.dispatchEvent(new Event('mouseup', { bubbles: true }));
    });

    // Complete is POST /api/goals/:id/complete
    const completed = page.waitForResponse(
      (r) => /\/api\/goals\/[^/]+\/complete$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 10_000 }
    );
    await card.getByRole('button', { name: /^complete$/i }).click();
    await completed;

    await expect(cardFor(page, GOAL_TITLE).getByText(/completed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('reports page renders the badge wall for the employee', async ({ page }) => {
    await login(page, 'employee').catch(() => {});
    await page.goto('/dashboard/reports');
    await expect(page.getByText(/your score|achievement/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
