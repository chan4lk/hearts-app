import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 60000,
  expect: { timeout: 10000 },

  projects: [
    // Auth setup - runs first
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      testDir: './e2e',
    },

    // API tests - single worker to avoid rate limiting (all requests share localhost IP)
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      dependencies: ['setup'],
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.resolve(__dirname, 'e2e/auth/admin.json'),
      },
    },

    // E2E UI tests - authenticated
    {
      name: 'e2e',
      testMatch: /ui\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
