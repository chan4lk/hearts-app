import type { Page } from '@playwright/test';

/**
 * Shared E2E fixtures — seed-matched credentials.
 *
 * Kept in a non-*.spec.ts file so Playwright doesn't treat it as a test
 * (Playwright disallows spec→spec imports).
 */
export const USERS = {
  admin:    { email: 'admin@example.com',    password: 'admin123' },
  manager:  { email: 'manager@example.com',  password: 'manager123' },
  employee: { email: 'employee@example.com', password: 'employee123' },
} as const;

/**
 * Login + onboarding-skip helper.
 *
 * The OnboardingWizard auto-opens on first /dashboard/feed visit and
 * intercepts every pointer event behind its backdrop. We pre-set the
 * `aspirehub-onboarded` localStorage flag before navigating so the wizard
 * stays dismissed — skipping the distraction without needing to click
 * through it per test.
 */
export async function login(page: Page, who: keyof typeof USERS) {
  const u = USERS[who];

  // Seed the onboarding-skip flag on every page this context loads.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('aspirehub-onboarded', 'true');
    } catch {
      /* storage unavailable — fine */
    }
  });

  await page.goto('/login');
  await page.getByRole('textbox', { name: /email/i }).fill(u.email);
  await page.locator('#password').fill(u.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
