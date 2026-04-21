import { test, expect } from '@playwright/test';
import { login } from './fixtures';

/**
 * Report export smoke — CSV + PDF downloads work.
 * Verifies the browser actually downloads a file with the expected
 * filename prefix. Doesn't parse the file contents (that's what the
 * route/unit layer is for).
 */

test.describe('Reports — export buttons', () => {
  // The CSV/PDF buttons use aria-label="Export report as CSV|PDF" so the
  // accessible name is that phrase, not the visible "CSV"/"PDF" text.
  const CSV_BTN = /export report as csv/i;
  const PDF_BTN = /export report as pdf/i;

  test('admin exports CSV of the company report', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, 'admin');
    await page.goto('/dashboard/reports');

    // The "Company Report" tab only renders when isAdmin === true — which
    // requires useSession to have hydrated. Wait for "ADMIN Portal" text in
    // the sidebar so we know role context is set.
    await expect(page.getByText(/admin portal/i).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /company report/i }).click();

    await expect(page.getByText(/total goals/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: CSV_BTN })).toBeVisible({ timeout: 10_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByRole('button', { name: CSV_BTN }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/aspirehub-report.*\.csv$/);
  });

  test('employee exports PDF of their self report', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/dashboard/reports');

    const pdfBtn = page.getByRole('button', { name: PDF_BTN });
    if ((await pdfBtn.count()) === 0) {
      test.skip(true, 'No data in self report — export buttons hidden by UI');
      return;
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await pdfBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/aspirehub-report.*\.pdf$/);
  });
});
