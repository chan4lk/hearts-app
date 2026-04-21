# Bistec AspireHub — Automated Testing Guide

Three-layer automated test strategy (pairs with [TESTING.md](TESTING.md),
which covers manual peer testing).

```
        ▲  E2E (Playwright)          — few, slow, flaky; catches wiring bugs
       ─┼─
      ▲  Route tests (Vitest + mocks)— many, fast; catches RBAC + validation
     ───┼───
    ▲   Unit / pure logic (Vitest)   — most, fastest; catches math + state
   ─────┴─────
```

A feature is **fully tested** when it has coverage in all three layers
(proportioned roughly like a pyramid — many unit, fewer route, few E2E).

---

## 1. Unit / pure logic — `npm test`

Lives in [`__tests__/*.test.ts`](../__tests__). Fast, deterministic, no DB.

Currently covered: rbac (18), goalStateMachine (21), logger (6), rateLimit (5),
cache (5), contrast (12) — **67 cases**.

Add more by creating `__tests__/<thing>.test.ts` and running `npm test`.

---

## 2. API route tests — `npm test`

Lives in [`__tests__/api.*.test.ts`](../__tests__). Mocks Prisma, session,
and fire-and-forget side effects (email, badges, audit). Imports the Next.js
App-Router route handler directly and calls it with a constructed `NextRequest`.

Currently covered: `/api/goals` POST (8), `/api/hearts` POST (9) — **17 cases**.

**Why no supertest?** App-Router handlers are plain
`async (req) => NextResponse` — calling them directly is faster than HTTP
round-trips and gives you the Response object to assert on.

**Pattern**:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

let currentCtx: TenantContext | null = null;
const mockPrisma = { /* only the calls this route makes */ };
vi.mock('../lib/tenantScope', () => ({ getTenantContext: () => Promise.resolve(currentCtx) }));
vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

describe('POST /api/<route>', () => {
  beforeEach(() => { vi.clearAllMocks(); currentCtx = null; });
  it('covers scenario X', async () => {
    currentCtx = /* build ctx */;
    const { POST } = await import('../app/api/<route>/route');
    const res = await POST(new NextRequest('http://localhost/...', {
      method: 'POST', body: JSON.stringify({/* body */})
    }));
    expect(res.status).toBe(XXX);
  });
});
```

**Route coverage matrix — what's left to write** (~80 cases, ~4 hours):

| Route | What to cover |
|---|---|
| `PATCH /api/goals/:id` | state transitions, who-can-approve, who-can-complete |
| `POST /api/goals/bulk` | manager-assign RBAC (same rule as single) |
| `POST /api/goals/:id/complete` | only owner + ACTIVE, awards badge |
| `POST /api/events` | admin-only, date validation |
| `POST /api/events/:id/rsvp` | meal-pref validation, no RSVP past event |
| `POST /api/review-cycles` | admin-only |
| `POST /api/users` | admin-only, email uniqueness |
| `PATCH /api/users/:id` | self vs admin, role-change audit |
| `GET /api/reports/summary` | scope=self/team/all RBAC |

---

## 3. End-to-end (Playwright) — `npm run e2e`

Lives in [`tests/e2e/*.spec.ts`](../tests/e2e). Real browser, real dev
server, real Postgres. Slowest layer — reserve for flows the lower layers
can't catch (cross-page navigation, cookies, DOM wiring, auth).

### One-time setup

```bash
npm run e2e:install      # downloads Chromium (~180MB) — once per machine
npm run prisma:seed      # creates admin/manager/employee with hashed passwords
```

Shared credentials live in [`tests/e2e/fixtures.ts`](../tests/e2e/fixtures.ts).
Every spec imports `USERS` from there so a password change touches one file.

### Running

```bash
npm run e2e              # headless run against local dev server
npm run e2e:ui           # interactive runner — pick a test, step through
npx playwright show-report                           # open the last HTML report
npx playwright show-trace test-results/.../trace.zip # debug a specific failure
```

### Current coverage

| Spec | What it exercises |
|---|---|
| `auth.spec.ts` | unauth redirect to login, credentials login |
| `goals.spec.ts` | Goals page loads, New Goal modal opens |
| `goal-flow.spec.ts` (serial) | employee DRAFT → Submit → manager Approve → employee 100% → Complete → badge |
| `hearts.spec.ts` | Heart panel opens, self-selection blocked |
| `events.spec.ts` | seeded events visible, admin create button surfaces |

### "Full system" coverage — what's still missing

Golden flows to add (~1–2 hours each):

1. **Goal rejection loop** — manager rejects → NEEDS_REVISION → employee edits → resubmits → approved.
2. **Bulk assign** — manager creates 3 goals for the same report in one form.
3. **Admin all-goals tab** — admin sees goals from all users, can force-approve.
4. **Heart happy path** — pick recipient → pick value → message → send → feed + notification.
5. **Heart daily limit** — 3 to same person OK, 4th blocked with clear error.
6. **Heart hourly limit** — 30 OK, 31st blocked.
7. **Event RSVP with meal pref** — employee RSVPs + veg → admin sees in participants → admin cancels event → employee notified.
8. **Review cycle** — admin creates → auto-generates reviews → employee self-rates → manager rates → cycle closes.
9. **Admin user CRUD** — create, set manager, deactivate, reactivate, badge filter.
10. **Template CRUD + auto-fill** — admin creates template → employee uses it → category auto-fills.
11. **Reports CSV export** — click CSV → file downloads → contents verified.
12. **Reports PDF export** — click PDF → downloads → table renders.
13. **Notifications panel** — unread count decrement, in-app link routes correctly.
14. **Dark mode** — toggle, contrast pairs still hold (extend contrast.test.ts with dark theme).
15. **Mobile viewport (375px)** — re-run goal-flow with `devices['iPhone SE']` as a second project in `playwright.config.ts`.

### Patterns that pay off

**Use accessible-name selectors in this priority order**:

1. `getByRole('button', { name: 'Submit', exact: true })` — survives class renames
2. `getByPlaceholder('Goal title')` — when no `<label>` exists (common in this app)
3. `getByLabel(/email/i)` — when a proper `<label for>` or `aria-label` exists
4. `locator('.card-interactive', { hasText: title })` — scope to one card
5. `locator('#id')` — last resort; for unambiguous IDs (e.g., `#password`)

**Avoid ambiguous regex**. `getByLabel(/password/i)` matched the
"Show password" toggle button and failed with a strict-mode violation. Use
`locator('#password')` or `getByRole('textbox', { name: 'Password', exact: true })`.

**Serial suites share state**. `test.describe.configure({ mode: 'serial' })`
lets each test see the previous test's DB writes. Good for approval cycles —
a failure cascades to skip the rest so you see the root cause, not ten
downstream errors.

**Session isolation via cookies**. `await page.context().clearCookies()`
logs out cleanly without hitting the signout page. For truly independent
user sessions, use `browser.newContext()` per role.

**Don't drag sliders**. `input[type=range]` is flaky with `.dragTo()`. Focus,
press End (jumps to max), then dispatch the commit event the component
listens to:

```ts
await slider.focus();
await page.keyboard.press('End');
await slider.evaluate((el: HTMLInputElement) => {
  el.dispatchEvent(new Event('mouseup', { bubbles: true }));
});
```

**Wait for state, not time**. No `page.waitForTimeout(2000)`. Always wait on
a concrete post-condition: `expect(locator).toBeVisible()`,
`page.waitForURL(/regex/)`, or `page.waitForResponse(url => url.includes('/api/goals'))`.

### CI integration (not yet wired)

Minimal GitHub Actions shape:

```yaml
- run: docker compose up -d postgres
- run: npm ci
- run: npx prisma migrate deploy
- run: npx prisma db seed
- run: npm test                     # unit + route
- run: npm run e2e:install
- run: npm run build
- run: CI=true npm start &          # or use webServer in playwright.config.ts
- run: npm run e2e
- if: failure()
  uses: actions/upload-artifact@v4  # upload playwright-report/
```

Keep E2E in a separate job so a flaky UI test doesn't block unit-test feedback.

---

## Triage order when a test fails

1. **Is it my change?** `git bisect` against `main` or read the failing diff.
2. **Is it the DOM?** Open `npx playwright show-trace <trace.zip>` and look
   at the screenshot + network tab at the failure frame.
3. **Is it the DB?** `npm run prisma:seed` — stale data leaks across runs
   (especially serial suites creating DRAFT goals that don't clean up).
4. **Is it an async race?** Replace `getByText` with
   `expect(locator).toBeVisible()` — Playwright auto-retries the assertion
   up to `expect.timeout` ms.
5. **Is it a flake worth ignoring?** No. Fix or delete. Skipped tests rot.
