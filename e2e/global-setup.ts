import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const users = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    storageStatePath: path.resolve(__dirname, 'auth/admin.json'),
    role: 'admin',
  },
  {
    email: 'manager@example.com',
    password: 'manager123',
    storageStatePath: path.resolve(__dirname, 'auth/manager.json'),
    role: 'manager',
  },
  {
    email: 'employee@example.com',
    password: 'employee123',
    storageStatePath: path.resolve(__dirname, 'auth/employee.json'),
    role: 'employee',
  },
];

for (const user of users) {
  setup(`authenticate as ${user.role}`, async ({ playwright }) => {
    // Use a standalone API request context for auth
    const requestContext = await playwright.request.newContext({
      baseURL: BASE_URL,
    });

    // Step 1: Get CSRF token (this also sets the csrf cookie)
    const csrfResponse = await requestContext.get('/api/auth/csrf');
    expect(csrfResponse.ok()).toBeTruthy();
    const { csrfToken } = await csrfResponse.json();

    // Step 2: Sign in via credentials provider
    const signInResponse = await requestContext.post('/api/auth/callback/credentials', {
      form: {
        email: user.email,
        password: user.password,
        csrfToken,
        callbackUrl: `${BASE_URL}/dashboard/${user.role}`,
        json: 'true',
      },
    });
    expect(signInResponse.ok()).toBeTruthy();

    const result = await signInResponse.json();
    expect(result.url).toContain(`/dashboard/${user.role}`);

    // Step 3: Verify session works
    const sessionResponse = await requestContext.get('/api/auth/session');
    expect(sessionResponse.ok()).toBeTruthy();
    const session = await sessionResponse.json();
    expect(session.user).toBeDefined();
    expect(session.user.email).toBe(user.email);

    // Step 4: Save storage state for reuse by test projects
    const storageState = await requestContext.storageState();
    fs.mkdirSync(path.dirname(user.storageStatePath), { recursive: true });
    fs.writeFileSync(user.storageStatePath, JSON.stringify(storageState, null, 2));

    await requestContext.dispose();
  });
}
