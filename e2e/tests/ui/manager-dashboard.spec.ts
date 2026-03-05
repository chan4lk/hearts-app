import { test, expect } from '@playwright/test';
import path from 'path';

const managerAuth = path.resolve(__dirname, '../../auth/manager.json');

test.use({ storageState: managerAuth });

test.describe('Manager Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/manager');
    await page.waitForLoadState('networkidle');
  });

  test('should load manager dashboard with welcome message', async ({ page }) => {
    // The manager page inline HeroSection displays "Welcome back, {name || 'Manager'}"
    const welcomeHeading = page.getByText(/Welcome back,/i);
    await expect(welcomeHeading).toBeVisible({ timeout: 15000 });
  });

  test('should display sidebar with manager-specific navigation items', async ({ page }) => {
    // Manager sidebar nav items from DashboardLayout getNavItems() for manager context
    const navItems = [
      'Overview',
      'Goal Approvals',
      'Set Team Goals',
      'Rate Team',
      '360 Feedback',
      'Meetings',
      'Exit Interviews',
      'Analytics',
    ];

    for (const item of navItems) {
      const navLink = page.locator('nav').getByText(item, { exact: true });
      await expect(navLink.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display the subtitle text', async ({ page }) => {
    const subtitle = page.getByText("Manage your team's goals and performance");
    await expect(subtitle).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Set Team Goals page', async ({ page }) => {
    const setGoalsLink = page.locator('nav').getByText('Set Team Goals', { exact: true });
    await expect(setGoalsLink.first()).toBeVisible({ timeout: 10000 });
    await setGoalsLink.first().click();
    await page.waitForURL(/\/dashboard\/manager\/goals\/setgoals/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/manager/goals/setgoals');
  });

  test('should navigate to Goal Approvals page', async ({ page }) => {
    const approveGoalsLink = page.locator('nav').getByText('Goal Approvals', { exact: true });
    await expect(approveGoalsLink.first()).toBeVisible({ timeout: 10000 });
    await approveGoalsLink.first().click();
    await page.waitForURL(/\/dashboard\/manager\/goals\/approve-goals/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/manager/goals/approve-goals');
  });

  test('should navigate to Rate Team page', async ({ page }) => {
    const rateLink = page.locator('nav').getByText('Rate Team', { exact: true });
    await expect(rateLink.first()).toBeVisible({ timeout: 10000 });
    await rateLink.first().click();
    await page.waitForURL(/\/dashboard\/manager\/rate-employees/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/manager/rate-employees');
  });

  test('should navigate to 360 Feedback page', async ({ page }) => {
    const feedbackLink = page.locator('nav').getByText('360 Feedback', { exact: true });
    await expect(feedbackLink.first()).toBeVisible({ timeout: 10000 });
    await feedbackLink.first().click();
    await page.waitForURL(/\/dashboard\/manager\/feedback/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/manager/feedback');
  });

  test('should navigate to Meetings page', async ({ page }) => {
    const meetingsLink = page.locator('nav').getByText('Meetings', { exact: true });
    await expect(meetingsLink.first()).toBeVisible({ timeout: 10000 });
    await meetingsLink.first().click();
    await page.waitForURL(/\/dashboard\/manager\/meetings/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/manager/meetings');
  });

  test('should navigate to Analytics page', async ({ page }) => {
    const analyticsLink = page.locator('nav').getByText('Analytics', { exact: true });
    await expect(analyticsLink.first()).toBeVisible({ timeout: 10000 });
    await analyticsLink.first().click();
    await page.waitForURL(/\/dashboard\/analytics/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/analytics');
  });
});
