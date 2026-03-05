import { test as base, expect, APIRequestContext } from '@playwright/test';
import path from 'path';

// Storage state paths
export const AUTH_STATES = {
  admin: path.resolve(__dirname, '../auth/admin.json'),
  manager: path.resolve(__dirname, '../auth/manager.json'),
  employee: path.resolve(__dirname, '../auth/employee.json'),
} as const;

export type UserRole = keyof typeof AUTH_STATES;

// Extended test fixture with role-based helpers
type Fixtures = {
  adminRequest: APIRequestContext;
  managerRequest: APIRequestContext;
  employeeRequest: APIRequestContext;
  adminPage: ReturnType<typeof base['extend']> extends infer T ? any : never;
};

export const test = base.extend<Fixtures>({
  // API request context pre-authenticated as admin
  adminRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      storageState: AUTH_STATES.admin,
    });
    await use(context);
    await context.dispose();
  },

  // API request context pre-authenticated as manager
  managerRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      storageState: AUTH_STATES.manager,
    });
    await use(context);
    await context.dispose();
  },

  // API request context pre-authenticated as employee
  employeeRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      storageState: AUTH_STATES.employee,
    });
    await use(context);
    await context.dispose();
  },
});

export { expect };
