import { test, expect } from '@playwright/test';
import path from 'path';

const adminAuth = path.resolve(__dirname, '../../auth/admin.json');
const managerAuth = path.resolve(__dirname, '../../auth/manager.json');
const employeeAuth = path.resolve(__dirname, '../../auth/employee.json');

test.describe('RBAC Navigation Enforcement', () => {

  test.describe('Admin role access', () => {
    test.use({ storageState: adminAuth });

    test('admin can access /dashboard/admin', async ({ page }) => {
      await page.goto('/dashboard/admin');
      await page.waitForLoadState('networkidle');
      // Admin should stay on admin dashboard (not redirected)
      await expect(page).toHaveURL(/\/dashboard\/admin/);
      const welcomeText = page.getByText(/Welcome back,/i);
      await expect(welcomeText).toBeVisible({ timeout: 15000 });
    });

    test('admin can access /dashboard/manager', async ({ page }) => {
      // Admin has access to all dashboard paths per hasAccess() and middleware
      await page.goto('/dashboard/manager');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/manager/);
    });

    test('admin can access /dashboard/employee', async ({ page }) => {
      await page.goto('/dashboard/employee');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/employee/);
    });

    test('admin can access /dashboard/analytics', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/analytics/);
    });

    test('admin has Sign Out button visible', async ({ page }) => {
      await page.goto('/dashboard/admin');
      await page.waitForLoadState('networkidle');
      // Sign Out button is in the desktop sidebar
      const signOutButton = page.locator('text=Sign Out').first();
      await expect(signOutButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Manager role access', () => {
    test.use({ storageState: managerAuth });

    test('manager can access /dashboard/manager', async ({ page }) => {
      await page.goto('/dashboard/manager');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/manager/);
      const welcomeText = page.getByText(/Welcome back,/i);
      await expect(welcomeText).toBeVisible({ timeout: 15000 });
    });

    test('manager cannot access /dashboard/admin and is redirected', async ({ page }) => {
      await page.goto('/dashboard/admin');
      // Middleware should redirect manager away from admin dashboard
      await page.waitForURL(/\/dashboard\/manager/, { timeout: 15000 });
      expect(page.url()).toContain('/dashboard/manager');
    });

    test('manager can access /dashboard/employee', async ({ page }) => {
      // Manager has access to employee paths per ROLE_ACCESS
      await page.goto('/dashboard/employee');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/employee/);
    });

    test('manager can access /dashboard/analytics', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/analytics/);
    });

    test('manager has Sign Out button visible', async ({ page }) => {
      await page.goto('/dashboard/manager');
      await page.waitForLoadState('networkidle');
      const signOutButton = page.locator('text=Sign Out').first();
      await expect(signOutButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Employee role access', () => {
    test.use({ storageState: employeeAuth });

    test('employee can access /dashboard/employee', async ({ page }) => {
      await page.goto('/dashboard/employee');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/employee/);
      const welcomeText = page.getByText(/Welcome back,/i);
      await expect(welcomeText).toBeVisible({ timeout: 15000 });
    });

    test('employee cannot access /dashboard/admin and is redirected', async ({ page }) => {
      await page.goto('/dashboard/admin');
      // Middleware should redirect employee away from admin dashboard
      await page.waitForURL(/\/dashboard\/employee/, { timeout: 15000 });
      expect(page.url()).toContain('/dashboard/employee');
    });

    test('employee cannot access /dashboard/manager and is redirected', async ({ page }) => {
      await page.goto('/dashboard/manager');
      // Middleware should redirect employee away from manager dashboard
      await page.waitForURL(/\/dashboard\/employee/, { timeout: 15000 });
      expect(page.url()).toContain('/dashboard/employee');
    });

    test('employee can access /dashboard/analytics', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/analytics/);
    });

    test('employee has Sign Out button visible', async ({ page }) => {
      await page.goto('/dashboard/employee');
      await page.waitForLoadState('networkidle');
      const signOutButton = page.locator('text=Sign Out').first();
      await expect(signOutButton).toBeVisible({ timeout: 10000 });
    });
  });
});
