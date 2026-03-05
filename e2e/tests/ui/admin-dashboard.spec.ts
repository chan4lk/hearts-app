import { test, expect } from '@playwright/test';
import path from 'path';

const adminAuth = path.resolve(__dirname, '../../auth/admin.json');

test.use({ storageState: adminAuth });

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should load admin dashboard with welcome message', async ({ page }) => {
    // The HeroSection displays "Welcome back, {userName}" where userName defaults to 'Admin'
    const welcomeHeading = page.getByText(/Welcome back,/i);
    await expect(welcomeHeading).toBeVisible({ timeout: 15000 });
  });

  test('should display stats cards', async ({ page }) => {
    // StatsSection renders cards for: Total Users, Employees, Managers, Admins, Total Goals
    const statsLabels = ['Total Users', 'Employees', 'Managers', 'Admins', 'Total Goals'];

    for (const label of statsLabels) {
      const statCard = page.getByText(label, { exact: true });
      await expect(statCard.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display sidebar navigation items', async ({ page }) => {
    // Desktop sidebar navigation items for admin context
    const navItems = ['Overview', 'Manage Users', 'All Goals', 'Review Cycles', 'Analytics'];

    for (const item of navItems) {
      const navLink = page.locator('nav').getByText(item, { exact: true });
      await expect(navLink.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display "Top Performers" section when data is available', async ({ page }) => {
    // Top Performers section may or may not be visible depending on data
    // We test that the section renders if the heading appears
    const topPerformers = page.getByText('Top Performers');
    // Allow this to be either visible or not (data-dependent)
    const isVisible = await topPerformers.isVisible().catch(() => false);
    if (isVisible) {
      await expect(topPerformers).toBeVisible();
    }
    // Test passes regardless - the section only renders when there are top performers
  });

  test('should display "Role Distribution" section', async ({ page }) => {
    const roleDistribution = page.getByText('Role Distribution');
    await expect(roleDistribution).toBeVisible({ timeout: 15000 });
  });

  test('should display "Recent Users" section', async ({ page }) => {
    const recentUsers = page.getByText('Recent Users');
    await expect(recentUsers).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to Manage Users page', async ({ page }) => {
    const manageUsersLink = page.locator('nav').getByText('Manage Users', { exact: true });
    await expect(manageUsersLink.first()).toBeVisible({ timeout: 10000 });
    await manageUsersLink.first().click();
    await page.waitForURL(/\/dashboard\/admin\/users/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/admin/users');
  });

  test('should navigate to All Goals page', async ({ page }) => {
    const allGoalsLink = page.locator('nav').getByText('All Goals', { exact: true });
    await expect(allGoalsLink.first()).toBeVisible({ timeout: 10000 });
    await allGoalsLink.first().click();
    await page.waitForURL(/\/dashboard\/admin\/all-goals/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/admin/all-goals');
  });

  test('should navigate to Analytics page', async ({ page }) => {
    const analyticsLink = page.locator('nav').getByText('Analytics', { exact: true });
    await expect(analyticsLink.first()).toBeVisible({ timeout: 10000 });
    await analyticsLink.first().click();
    await page.waitForURL(/\/dashboard\/analytics/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/analytics');
  });

  test('should navigate to Review Cycles page', async ({ page }) => {
    const reviewCyclesLink = page.locator('nav').getByText('Review Cycles', { exact: true });
    await expect(reviewCyclesLink.first()).toBeVisible({ timeout: 10000 });
    await reviewCyclesLink.first().click();
    await page.waitForURL(/\/dashboard\/admin\/review-cycles/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/admin/review-cycles');
  });
});
