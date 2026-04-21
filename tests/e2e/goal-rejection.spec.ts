import { test, expect, Page } from '@playwright/test';
import { login, logout } from './fixtures';

/**
 * Goal-rejection loop:
 *   employee DRAFT → Submit → PENDING
 *   manager  Revise → NEEDS_REVISION
 *   employee Resubmit → PENDING
 *   manager  Approve → ACTIVE
 *
 * Serial — each test depends on the previous DB state.
 */
test.describe.configure({ mode: 'serial' });

const GOAL_TITLE = `E2E Reject ${Date.now()}`;

const cardFor = (page: Page, title: string) =>
  page.locator('.card-interactive', { hasText: title }).first();

async function waitForGoalsPatch(page: Page) {
  return page.waitForResponse(
    (r) => /\/api\/goals\/[^/]+$/.test(r.url()) && r.request().method() === 'PATCH',
    { timeout: 10_000 }
  );
}

test.describe('Goal rejection loop — revise then approve', () => {
  test('employee creates + submits a DRAFT', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/goals');

    await page.getByRole('button', { name: /^new goal$/i }).first().click();
    await page.getByPlaceholder('Goal title').first().fill(GOAL_TITLE);

    const bulkResp = page.waitForResponse(
      (r) => r.url().includes('/api/goals/bulk') && r.request().method() === 'POST',
      { timeout: 15_000 }
    );
    await page.getByRole('button', { name: /^create(?: \d+)? goals?$/i }).click();
    const res = await bulkResp;
    expect(res.ok()).toBe(true);

    await expect(cardFor(page, GOAL_TITLE)).toBeVisible({ timeout: 10_000 });
    const patched = waitForGoalsPatch(page);
    await cardFor(page, GOAL_TITLE).getByRole('button', { name: /^submit$/i }).click();
    await patched;
    await expect(cardFor(page, GOAL_TITLE).getByText(/pending/i)).toBeVisible({ timeout: 10_000 });
  });

  test('manager rejects the goal with a revise request', async ({ page }) => {
    await logout(page);
    await login(page, 'manager');
    await page.goto('/dashboard/goals');
    await page.getByRole('button', { name: /^team goals$/i }).click();

    await expect(cardFor(page, GOAL_TITLE)).toBeVisible({ timeout: 10_000 });

    // Revise opens a modal — click the card's Revise button
    await cardFor(page, GOAL_TITLE).getByRole('button', { name: /^revise$/i }).click();

    // The modal asks for a revision comment before submitting
    const textarea = page
      .getByRole('dialog')
      .getByRole('textbox')
      .or(page.getByPlaceholder(/be specific/i))
      .first();
    await textarea.fill('Please add a measurable success criterion.');

    // The submit POSTs to /api/goals/:id/revise (not PATCH on the base route)
    const revised = page.waitForResponse(
      (r) => /\/api\/goals\/[^/]+\/revise$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 10_000 }
    );
    await page.getByRole('button', { name: /send revision request/i }).click();
    const res = await revised;
    expect(res.ok()).toBe(true);

    await expect(
      cardFor(page, GOAL_TITLE).getByText(/revision|needs_revision|needs revision/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('employee resubmits the revised goal', async ({ page }) => {
    await logout(page);
    await login(page, 'employee');
    await page.goto('/dashboard/goals');

    await expect(cardFor(page, GOAL_TITLE)).toBeVisible({ timeout: 10_000 });

    const patched = waitForGoalsPatch(page);
    await cardFor(page, GOAL_TITLE).getByRole('button', { name: /^resubmit$/i }).click();
    await patched;

    await expect(cardFor(page, GOAL_TITLE).getByText(/pending/i)).toBeVisible({ timeout: 10_000 });
  });

  test('manager approves on the second attempt', async ({ page }) => {
    await logout(page);
    await login(page, 'manager');
    await page.goto('/dashboard/goals');
    await page.getByRole('button', { name: /^team goals$/i }).click();

    await expect(cardFor(page, GOAL_TITLE)).toBeVisible({ timeout: 10_000 });

    const approved = page.waitForResponse(
      (r) => /\/api\/goals\/[^/]+\/approve$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 10_000 }
    );
    await cardFor(page, GOAL_TITLE).getByRole('button', { name: /^approve$/i }).click();
    await approved;

    await expect(cardFor(page, GOAL_TITLE).getByText(/active/i)).toBeVisible({ timeout: 10_000 });
  });
});
