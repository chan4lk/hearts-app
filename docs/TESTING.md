# Bistec AspireHub — Peer Testing Guide

A walk-through for a peer tester to validate the entire product end-to-end in ~45 minutes. No automation required — just a browser, a terminal, and the three seeded accounts.

---

## 0. Prerequisites

1. Postgres running (default: `localhost:5434/performance_management`).
2. `.env.local` has a valid `DATABASE_URL`, `NEXTAUTH_SECRET`, and (optionally) `APPLICATIONINSIGHTS_CONNECTION_STRING`.
3. From repo root:

   ```bash
   npm install
   npx prisma migrate deploy        # apply all migrations incl. cascade rules
   npm run prisma:seed              # wipes + seeds 3 users, 5 values, 15 goal templates, 8 events
   npm run dev                      # starts on http://localhost:3000
   ```

### Seeded credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Manager | `manager@example.com` | `manager123` |
| Employee | `employee@example.com` | `employee123` |

Employee reports to Manager. All three are seeded as participants in every seeded event.

> **Note:** `npm run prisma:seed` wipes and reseeds everything — users, values, goal templates, and the 8 events — in one go. There is no separate events-only seed; events live alongside the rest of the seed data.

---

## 1. Health & Infrastructure (2 min)

### 1.1 Health endpoint
```bash
curl http://localhost:3000/api/health
```
**Expect:** HTTP 200, JSON body with `status:"ok"`, `db:"up"`, `uptimeSec`, `latencyMs`.
If DB is down you should get HTTP 503 with `status:"degraded"`.

### 1.2 Security headers
```bash
curl -I http://localhost:3000/login
```
**Expect:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy`.

### 1.3 Secret leak check
Grep the client bundle for your NextAuth secret — should not appear.
```bash
grep -r "NEXTAUTH_SECRET" .next/static 2>/dev/null    # expect: no matches
```

---

## 2. Authentication (5 min)

### 2.1 Happy path login
- Navigate to http://localhost:3000/login
- Sign in as `employee@example.com` / `employee123`
- **Expect:** redirected to `/dashboard/feed`. Profile menu shows employee name.

### 2.2 Invalid credentials
- Sign in with wrong password.
- **Expect:** inline error "Invalid email or password". No hint about whether the email exists.

### 2.3 Rate limiting
```bash
for i in {1..7}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST -H "Content-Type: application/json" \
    --data '{"email":"nobody@example.com","password":"bad"}' \
    http://localhost:3000/api/auth/login
done
```
**Expect:** attempts 1–5 return `401`, attempt 6+ returns `429`. Inspect a `429` response — it should include `Retry-After`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset` headers.

### 2.4 Register validation
```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"name":"","email":"not-an-email","password":"123"}' \
  http://localhost:3000/api/auth/register
```
**Expect:** HTTP 400, `details` payload lists errors for `name`, `email`, and `password` (min 8 chars).

### 2.5 Logger telemetry
```bash
curl -X POST -H "Content-Type: application/json" --data 'not-json' \
  http://localhost:3000/api/auth/login
```
**Expect:** HTTP 500 with `{"message":"Error during login"}`. In the dev server stdout you should see a single JSON line:
```json
{"level":"error","message":"auth.login.failed","timestamp":"...","error":{"message":"...","name":"SyntaxError","stack":"..."}}
```

---

## 3. Goals State Machine (15 min)

Transitions to validate:

| From | Action | To | Who can |
|---|---|---|---|
| — | Create | DRAFT | Owner |
| DRAFT | Submit | PENDING | Owner |
| PENDING | Approve | ACTIVE | Manager / Admin |
| PENDING | Revise | NEEDS_REVISION | Manager / Admin |
| NEEDS_REVISION | Resubmit | PENDING | Owner |
| ACTIVE | Hold | ON_HOLD | Owner / Manager / Admin |
| ACTIVE | Block | BLOCKED | Owner / Manager / Admin |
| ON_HOLD / BLOCKED | Resume | ACTIVE | Owner / Manager / Admin |
| ACTIVE | Complete | COMPLETED | Owner / Manager / Admin |
| any | Close | CLOSED | Owner / Admin |

### 3.1 Create → Submit → Approve → Complete (golden path)
1. Sign in as **Employee**.
2. Go to `/dashboard/goals` → "New Goal".
3. Create one goal: title `Ship auth hardening`, description, target date.
4. **Expect:** goal appears in the DRAFT tab with a "Submit" button.
5. Click **Submit**. Status → PENDING.
6. Log out; sign in as **Manager**.
7. Open the same goal in PENDING. Click **Approve**.
8. **Expect:** status → ACTIVE. Employee gets an in-app notification (see §7).
9. Sign back in as Employee. Goal now shows a progress slider. Drag it to 70%. Release — progress persists.
10. Click **Complete** on the card.
11. **Expect:** status → COMPLETED. A `GOAL_COMPLETED` audit log row exists.

### 3.2 Revision flow
1. As Employee, create another goal and Submit.
2. As Manager, click **Revise** and enter the required comment.
3. **Expect:** goal → NEEDS_REVISION. Required comment is visible on the detail page under "Comments".
4. As Employee, edit the goal (Edit button — only available in DRAFT / NEEDS_REVISION), then **Resubmit**.
5. **Expect:** status → PENDING again. Comment thread preserved.

### 3.3 Hold / Block / Resume
1. Promote a goal to ACTIVE (via §3.1 up to step 8).
2. As Owner, click **On Hold** (or Block) from the detail page. Enter a reason.
3. **Expect:** goal status → ON_HOLD (or BLOCKED). Reason appears as a `HOLD_REASON` / `BLOCK_REASON` comment.
4. Click **Resume**. Status returns to ACTIVE.

### 3.4 Negative tests (forbidden transitions)
```bash
# Try DRAFT → COMPLETED (invalid per state machine). Replace <GOAL_ID>.
curl -X POST -H "Content-Type: application/json" \
  -b "next-auth.session-token=<your-session-cookie>" \
  http://localhost:3000/api/goals/<GOAL_ID>/complete
```
**Expect:** HTTP 409, `code:"CONFLICT"`, `error:"Cannot complete from DRAFT..."`.

### 3.5 Permission tests
- As Employee, try to approve another employee's goal → **403 FORBIDDEN**.
- As Manager, approve a goal whose owner reports to a *different* manager → **403 FORBIDDEN**.
- As Employee, delete a goal not in DRAFT status → **409 CONFLICT** ("Close instead to keep history").

### 3.6 Delete & cascade
1. As Admin, delete any goal.
2. **Expect:** the goal and all its comments are gone. Other goals untouched. (Cascade rules from migration `20260420185636_add_cascade_rules` ensure comments die with the goal.)

### 3.7 XSS sanitization
Create a goal with title `<script>alert(1)</script> Evil goal`.
**Expect:** title saved as `Evil goal` (tags stripped). Same for description and comments. Screen never alerts.

---

## 4. Hearts (5 min)

### 4.1 Give a heart
1. Sign in as Employee. Go to `/dashboard/hearts` (or hit the floating heart button).
2. Send a Heart to Manager, tagged with a value like `Teamwork`, message "Thanks for the unblock!".
3. **Expect:** heart appears in feed instantly. Manager gets a notification.

### 4.2 Self-heart prevention
```bash
# Replace IDs/cookies. receiverId = your own user id.
curl -X POST -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  --data '{"receiverId":"<own-id>","valueTagId":"<value-id>","message":"self"}' \
  http://localhost:3000/api/hearts
```
**Expect:** HTTP 409, `"Cannot give a heart to yourself"`.

### 4.3 Rate limits
- **Per-user limit:** give 30 hearts in an hour → 31st returns 429.
- **Per-recipient limit:** give 4 hearts to the same person in one day → 4th returns 409 `"You can send a maximum of 3 hearts per day..."`.

### 4.4 XSS / newline sanitization
Send a heart with message `<img src=x onerror=alert(1)> Great\n\n\n\n\nwork!`.
**Expect:** stored as `Great\n\nwork!` (tag stripped, excess newlines collapsed to ≤2).

---

## 5. Comments (3 min)

### 5.1 Post a comment
On any goal detail page, submit a comment as Employee.
**Expect:** comment appears immediately; type is `COMMENT`.

### 5.2 Empty-after-sanitize
Post comment `<script></script>`.
**Expect:** HTTP 400, `"Comment cannot be empty after sanitization"`.

### 5.3 Comment rate limit
Post 51 comments in an hour — 51st → HTTP 429.

---

## 6. Admin Surface (7 min)

### 6.1 Route protection
Sign in as Employee, navigate to `/dashboard/admin/users`.
**Expect:** redirected to `/dashboard/feed` (middleware enforces ADMIN-only).

### 6.2 Company values
1. Sign in as Admin. Go to `/dashboard/admin/values`.
2. Create a value with name `  Empathy  <br>`.
3. **Expect:** saved as `Empathy` (whitespace + tags stripped).
4. Try to create another value with the same name → HTTP 409, `"A value with this name already exists"`.

### 6.3 User list + invite
1. Admin → `/dashboard/admin/users`. See seeded users.
2. Select multiple users → "Send invite".
3. **Expect:** emails queued (or logged in dev mode — see §7.2).
4. Programmatic batch-cap test:
```bash
# Build a 101-id array; expect 400
curl -X POST -H "Content-Type: application/json" \
  -b "next-auth.session-token=<admin-cookie>" \
  --data '{"userIds":['$(printf '"x%s",' {1..101} | sed 's/,$//')']}' \
  http://localhost:3000/api/admin/users/invite
```
**Expect:** HTTP 400, `"Cannot invite more than 100 users per request"`.

### 6.4 Bulk user import
Upload a small CSV (`Name,Email,Department,Position,ManagerEmail`) via the admin UI.
**Expect:** success summary `{ created: N, updated: M, errors: [] }`. Orphan `ManagerEmail` values produce a `warn` log but don't fail the import.

---

## 7. Notifications (3 min)

### 7.1 In-app notification bell
After §3.1 step 8 (manager approves), log in as the employee:
**Expect:** bell in top-right shows a red badge. Click → notification "Your goal has been approved".

### 7.2 Email mode (dev)
In `.env.local`, set `EMAIL_PROVIDER=log` (or unset to use DB-only). Trigger a goal approval.
**Expect:** dev server stdout shows a block like:
```
📧 [Email] To: employee@example.com | Subject: Your goal has been approved
```
In production with `APPLICATIONINSIGHTS_CONNECTION_STRING` set, any provider failures will surface in App Insights as `email.send.failed` exception events with `tenantId`, `recipientId`, `template`.

---

## 8. Events (5 min)

### 8.1 Seed sanity
```bash
# Employee cookie
curl -s -b "next-auth.session-token=<cookie>" http://localhost:3000/api/events | jq 'length'
```
**Expect:** `8` — CodeCrunch, Toastmasters, Hearts Talk, Mentoring Interns & Undergraduates, University Branding Drive, Marketing & Branding — Hearts Academy, Training Program Organizing Committee, BISTEC Podcast — Recording Day.

### 8.2 Event list UI
- `/dashboard/events` (or wherever events are surfaced in your build).
- **Expect:** all 8 events render, sorted by `dateTime` ascending. Each shows title, date/time, location, event type.

### 8.3 RSVP lifecycle
1. Open any event.
2. Change participation from PENDING → CONFIRMED.
3. **Expect:** card badge updates, DB shows `EventParticipation.status = 'CONFIRMED'`.
4. Change to DECLINED. Verify persisted.

### 8.4 Admin event edit / cancel
As Admin, edit one event's `eventType` to something non-seeded (e.g., `Test`). Save.
**Expect:** update persists. Cancel the event → status `CANCELLED` and UI reflects it.

### 8.5 Cascade verification
As Admin, delete one event via DB (or an admin UI if present).
**Expect:** all `EventParticipation` rows for that event are gone (migration `add_cascade_rules`). No orphans.

---

## 9. Design System Spot Checks (2 min)

Open DevTools → search DOM for:
- `text-white` → expect **no matches** in rendered app components (should use `text-[rgb(var(--color-text-inverse))]`).
- `bg-indigo-` / `bg-emerald-` / `text-red-` → expect **no matches**.
- Focus any button → should show the `.focus-ring` outline, not a browser default blue ring.
- Status badges for DRAFT / PENDING / ACTIVE / COMPLETED / ON_HOLD should all be distinguishable at a glance (WCAG contrast).

---

## 10. Regression Check (1 min)

```bash
npx tsc --noEmit    # type check
npm test            # 45+ vitest cases
npm run build       # production build — should succeed without errors
```

All three must be clean before merging.

---

## Reporting Bugs

When you find something:
1. **File** in `BUG-PEER-TEST-YYYY-MM-DD-<slug>.md` under `docs/bugs/`.
2. Include: steps to reproduce, expected vs actual, role used, browser, timestamp (so it can be cross-referenced against `auditLog` / App Insights).
3. If the issue is in a logged path, grab the corresponding `logger.error` JSON line from the dev server stdout — it's gold for debugging.

---

## Known Deferrable Items (not blockers)

- `openai@4.96.0` installed but unused — will be removed / wired up later (~400KB bundle savings pending).
- Dashboard pages are all client-rendered; RSC conversion for performance is a separate effort.
- Rate limiter is in-memory — swap to Redis before horizontal scale.
- Analytics dashboard fires 7+ parallel `count()` queries; caching + `groupBy` planned.
