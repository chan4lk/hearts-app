import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for Bistec AspireHub.
 *
 * Usage:
 *   npx playwright install chromium        # one-time: download browser binary (~150MB)
 *   npm run e2e                             # run against a dev server on :3000
 *   npm run e2e:ui                          # interactive UI mode
 *
 * Tests assume seeded users exist (see prisma/seed.ts). For CI, spin up a
 * fresh Postgres, run `prisma migrate deploy && prisma db seed`, then `npm run e2e`.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // DB state is shared
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Spin up the dev server if not already running (skip in CI where you
  // start it yourself in a prior step).
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
