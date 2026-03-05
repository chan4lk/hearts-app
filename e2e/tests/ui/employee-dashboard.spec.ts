import { test, expect } from '@playwright/test';
import path from 'path';

const employeeAuth = path.resolve(__dirname, '../../auth/employee.json');

test.use({ storageState: employeeAuth });

test.describe('Employee Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/employee');
    await page.waitForLoadState('networkidle');
  });

  test('should load employee dashboard with welcome message', async ({ page }) => {
    // The employee HeroSection displays "Welcome back, {userName}" where userName defaults to 'User'
    const welcomeHeading = page.getByText(/Welcome back,/i);
    await expect(welcomeHeading).toBeVisible({ timeout: 15000 });
  });

  test('should display the subtitle text', async ({ page }) => {
    const subtitle = page.getByText('Track and manage your goals');
    await expect(subtitle).toBeVisible({ timeout: 10000 });
  });

  test('should display sidebar with employee-specific navigation items', async ({ page }) => {
    // Employee sidebar nav items from DashboardLayout getNavItems() for employee context
    const navItems = [
      'Overview',
      'My Goals',
      'Self Rating',
      'Surveys',
      'Analytics',
    ];

    for (const item of navItems) {
      const navLink = page.locator('nav').getByText(item, { exact: true });
      await expect(navLink.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display quick action cards', async ({ page }) => {
    // Employee dashboard has quick action cards
    const createGoalCard = page.getByText('Create New Goal');
    await expect(createGoalCard).toBeVisible({ timeout: 10000 });

    const aiSuggestionsCard = page.getByText('AI Goal Suggestions');
    await expect(aiSuggestionsCard).toBeVisible({ timeout: 10000 });

    const insightsCard = page.getByText('Performance Insights');
    await expect(insightsCard).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to My Goals (Create Goal) page', async ({ page }) => {
    const myGoalsLink = page.locator('nav').getByText('My Goals', { exact: true });
    await expect(myGoalsLink.first()).toBeVisible({ timeout: 10000 });
    await myGoalsLink.first().click();
    await page.waitForURL(/\/dashboard\/employee\/goals\/create/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/employee/goals/create');
  });

  test('should navigate to Self Rating page', async ({ page }) => {
    const selfRatingLink = page.locator('nav').getByText('Self Rating', { exact: true });
    await expect(selfRatingLink.first()).toBeVisible({ timeout: 10000 });
    await selfRatingLink.first().click();
    await page.waitForURL(/\/dashboard\/employee\/self-rating/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/employee/self-rating');
  });

  test('should navigate to Surveys page', async ({ page }) => {
    const surveyLink = page.locator('nav').getByText('Surveys', { exact: true });
    await expect(surveyLink.first()).toBeVisible({ timeout: 10000 });
    await surveyLink.first().click();
    await page.waitForURL(/\/dashboard\/employee\/survey/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard/employee/survey');
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
