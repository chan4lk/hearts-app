import { test, Page, devices } from '@playwright/test';
import { login, USERS } from './fixtures';
import fs from 'node:fs';
import path from 'node:path';

/**
 * UI audit — walks each role through every page and captures full-page
 * screenshots into `ui-audit/<viewport>/<role>/<slug>.png`.
 *
 * Not a pass/fail suite. Each "test" is a capture step; if a click/navigation
 * fails we still save whatever the page looked like so the reviewer sees the
 * exact broken state.
 *
 * Run JUST this file:
 *   npx playwright test tests/e2e/ui-audit.spec.ts
 *
 * Screenshots land in d:\Hearts\Hearts-app\hearts-app\ui-audit\ — ignored by git.
 */

const ROOT = path.resolve(process.cwd(), 'ui-audit');

/** Pages each role should see — grouped by permission level. */
const EMPLOYEE_PAGES: Array<{ slug: string; url: string }> = [
  { slug: '01-feed',           url: '/dashboard/feed' },
  { slug: '02-goals',          url: '/dashboard/goals' },
  { slug: '03-events',         url: '/dashboard/events' },
  { slug: '04-reports-self',   url: '/dashboard/reports' },
  { slug: '05-reviews',        url: '/dashboard/reviews' },
];

const MANAGER_PAGES: Array<{ slug: string; url: string }> = [
  ...EMPLOYEE_PAGES,
  { slug: '06-team',           url: '/dashboard/team' },
];

const ADMIN_PAGES: Array<{ slug: string; url: string }> = [
  ...MANAGER_PAGES,
  { slug: '07-admin-dashboard',url: '/dashboard/admin' },
  { slug: '08-admin-users',    url: '/dashboard/admin/users' },
  { slug: '09-admin-templates',url: '/dashboard/admin/templates' },
  { slug: '10-admin-values',   url: '/dashboard/admin/values' },
  { slug: '11-admin-cycles',   url: '/dashboard/admin/cycles' },
  { slug: '12-admin-events',   url: '/dashboard/admin/events' },
  { slug: '13-admin-notifications', url: '/dashboard/admin/notifications' },
];

const PAGES_BY_ROLE: Record<keyof typeof USERS, typeof EMPLOYEE_PAGES> = {
  employee: EMPLOYEE_PAGES,
  manager:  MANAGER_PAGES,
  admin:    ADMIN_PAGES,
};

async function capture(page: Page, role: string, viewport: string, slug: string) {
  const dir = path.join(ROOT, viewport, role);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slug}.png`);
  // fullPage so we catch below-the-fold layout problems
  await page.screenshot({ path: file, fullPage: true });
  // eslint-disable-next-line no-console
  console.log(`[ui-audit] ${viewport}/${role}/${slug}.png`);
}

async function settle(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Give data fetches, images, and loading skeletons a moment to resolve.
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  } catch {
    /* capture whatever we have so the reviewer sees the broken state */
  }
}

// ── Desktop audits ────────────────────────────────────────────────────────
for (const role of Object.keys(PAGES_BY_ROLE) as (keyof typeof USERS)[]) {
  test(`ui-audit desktop · ${role}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, role);

    for (const p of PAGES_BY_ROLE[role]) {
      await settle(page, p.url);
      await capture(page, role, 'desktop', p.slug);
    }

    // Interactive states on the goals page — New Goal modal open
    await settle(page, '/dashboard/goals');
    const newGoalBtn = page.getByRole('button', { name: /^new goal$/i }).first();
    if (await newGoalBtn.isVisible().catch(() => false)) {
      await newGoalBtn.click();
      await page.waitForTimeout(500);
      await capture(page, role, 'desktop', '20-goals-modal-open');
      await page.keyboard.press('Escape').catch(() => {});
    }

    // Heart panel open on feed
    await settle(page, '/dashboard/feed');
    const heartBtn = page.getByRole('button', { name: 'Give a Heart', exact: true });
    if (await heartBtn.isVisible().catch(() => false)) {
      await heartBtn.click();
      await page.waitForTimeout(500);
      await capture(page, role, 'desktop', '21-heart-panel-open');
    }
  });
}

// ── Mobile audits (iPhone-sized, 390×844) ────────────────────────────────
for (const role of Object.keys(PAGES_BY_ROLE) as (keyof typeof USERS)[]) {
  test(`ui-audit mobile · ${role}`, async ({ browser }) => {
    test.setTimeout(180_000);
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await ctx.newPage();
    await login(page, role);

    for (const p of PAGES_BY_ROLE[role]) {
      await settle(page, p.url);
      await capture(page, role, 'mobile', p.slug);
    }

    await settle(page, '/dashboard/goals');
    const newGoalBtn = page.getByRole('button', { name: /^new goal$/i }).first();
    if (await newGoalBtn.isVisible().catch(() => false)) {
      await newGoalBtn.click();
      await page.waitForTimeout(500);
      await capture(page, role, 'mobile', '20-goals-modal-open');
    }

    await ctx.close();
  });
}
