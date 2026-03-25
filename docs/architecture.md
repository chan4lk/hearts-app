# Architecture — Bistec AspireHub

## 1. Executive Summary

Full-stack Next.js 14 monolith with App Router. Client-rendered pages, API route handlers, PostgreSQL via Prisma, JWT auth (NextAuth.js), Azure AD SSO, OpenAI integration. Deployed to Azure App Service via Docker.

## 2. System Architecture

### Edge Layer
- **`middleware.ts`** — Route protection and role-based access control at the edge
- Reads JWT token from NextAuth session
- Public routes: `/`, `/login`, `/register`, `/error` always accessible
- API routes pass through (auth handled at route level)
- Dashboard routes checked via `hasAccess(role, path)` from `app/utils/roleAccess.ts`
- Matcher config: `/dashboard/:path*`, `/api/((?!auth).)*`, `/login`, `/register`

### API Layer
- **46 route files**, **68 HTTP handlers** in `app/api/`
- Auth via `getServerSession(authOptions)` on 43 of 46 files
- Rate limiting (in-memory) on 16 routes across 5 tiers
- Zod validation on 9 routes
- 12 route groups: auth, admin, ai, analytics, employees, events, goals, health, notifications, ratings, reports, users

### Business Logic Layer
- **`lib/`** directory contains core services:
  - `auth.ts` — NextAuth config, Azure AD + Credentials providers, session caching
  - `validation.ts` — Zod schemas for all API inputs
  - `securityUtils.ts` — RBAC, input sanitization, account lockout, password policy
  - `rateLimit.ts` — In-memory rate limiter with 5 tiers
  - `openai.ts` — 7 AI functions (gpt-4o-mini, gpt-3.5-turbo)
  - `queryOptimization.ts` — Cached queries with TTL
  - `pagination.ts` — Standardized pagination utilities
  - `logger.ts` — Azure App Insights integration with PII redaction
  - `performanceMonitor.ts` — In-memory metrics (p50/p95/p99)

### Data Layer
- **Prisma ORM** with PostgreSQL 15
- 7 models, 8 enums
- Soft deletes on Goals (`deletedAt`/`deletedById`)
- Extensive composite indexing for dashboard/analytics queries
- Session auth cached for 10 seconds to reduce DB queries

### Client Layer
- All pages are `'use client'` components — no SSR
- Client-side `fetch()` to API routes
- Local `useState`/`useEffect` for state management (no Redux/Zustand)
- Optimistic updates with server reconciliation and rollback on error
- Semantic design system via CSS custom properties

## 3. Authentication & Authorization

### Authentication Flow

Two providers via NextAuth.js:

1. **Azure AD SSO** — OAuth flow, auto-creates user with EMPLOYEE role on first login. Case-insensitive email lookup. Handles P2002 unique constraint race conditions.
2. **Credentials** — Email/password with bcryptjs comparison. Account lockout: 5 failed attempts triggers 15-minute lockout, tracked via DB columns.

**Session strategy:** JWT, 30-day max age, 10-second in-memory TTL cache reduces DB hits during parallel API calls.

**Security:** Secure cookies in production (`__Secure-` prefix, httpOnly, sameSite: lax). JWT secret minimum 16 characters enforced.

### Authorization

- **Route Level:** `middleware.ts` checks JWT + role against `hasAccess(role, path)` from `app/utils/roleAccess.ts`
- **API Level:** `getServerSession(authOptions)` in every route handler, role checks inline
- **Resource Level:** `hasResourceAccess()` in `lib/securityUtils.ts` — employees access own goals, managers access team goals, admins access all
- **RBAC Matrix:** Static permission matrix in `securityUtils.ts` covering resources (goals, users, ratings, notifications, events) x actions (create, read, update, delete, approve, reject)

## 4. API Architecture

### Route Groups (12)

| Group | Routes | Auth | Key Features |
|-------|--------|------|-------------|
| auth | 3 | Public (login/register) + NextAuth | Azure AD SSO, credentials, lockout |
| admin | 9 | ADMIN only | Users, events, review cycles, stats, Excel import/export |
| ai | 6 | Authenticated | Goal suggestions, risk analysis, insights, feedback, reviews |
| analytics | 1 | Role-scoped | 7 parallel queries, handles DB connection limits |
| employees | 2 | ADMIN/MANAGER | Team member queries |
| events | 2 | Authenticated | Event browsing, participation management |
| goals | 14 | Role-based | Full CRUD, approval workflow, ratings, bulk, AI suggestions |
| health | 1 | Public | DB connectivity check |
| notifications | 1 | Own only | In-app notifications |
| ratings | 2 | Role-based | Batch self/manager ratings |
| reports | 1 | Authenticated | JSON/PDF report generation |
| users | 1 | ADMIN | User management |

### Rate Limiting

| Tier | Limit | Used By |
|------|-------|---------|
| strict | 5 req/15min | Login, password reset |
| moderate | 30 req/min | AI routes, goal mutations, user mutations |
| standard | 60 req/min | General API |
| lenient | 100 req/min | Read operations |
| bulk | 10 req/5min | Bulk goal creation |

### Input Validation

Zod schemas in `lib/validation.ts` used on 9 route handlers:
- `createGoalSchema`, `statusUpdateSchema`, `progressUpdateSchema`
- `ratingSubmitSchema`, `approveRejectSchema`
- `validateManagerSchema`, custom `requestSchema` for AI suggestions

## 5. Data Architecture

- **7 models:** User, Goal, Rating, Notification, ReviewCycle, Event, EventParticipation
- **All PKs:** CUID strings (`@default(cuid())`)
- **Soft deletes:** Goal (`deletedAt`/`deletedById`)
- **1:1:** Rating<->Goal (unique goalId), ReviewCycle<->User (unique userId)
- **Self-ref:** User.managerId -> User.id
- **Join table:** EventParticipation (unique [eventId, userId])
- **4 orphaned tables** in DB not in schema: Feedback, SystemSettings, EmailReminderSettings, EmailReminderLog
- **16 migrations** spanning April 2025 to March 2026

See [Data Models](./data-models.md) for full schema details.

## 6. Caching Strategy

| Cache | Location | TTL | Purpose |
|-------|----------|-----|---------|
| Session auth | `lib/auth.ts` (in-memory Map) | 10s | Reduce DB queries during parallel API calls |
| Query cache | `lib/queryOptimization.ts` (in-memory Map) | 5-10min | Dashboard stats, managed employees |
| Rate limit store | `lib/rateLimit.ts` (in-memory Map) | Window-based | Request counting per IP |

**Invalidation:** `invalidateUserCache(userId)`, `invalidateGoalCache(employeeId)` called on mutations.

**Note:** All caches are in-memory. Redis recommended for production scale.

## 7. Security

### Headers (next.config.js)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- Restrictive `Permissions-Policy`

### Account Protection
- Account lockout: 5 failed attempts -> 15-min lockout, 24h auto-reset
- Password policy: min 8 chars, uppercase, lowercase, number, special character
- Failed login tracking in DB

### Input Security
- HTML entity encoding for `< > " ' &` via `sanitizeInput()`
- Max length enforcement on all sanitized inputs
- Circular manager hierarchy detection via graph traversal

### Data Protection
- PII redaction in logging (password, token, secret, email, userId, etc.)
- Secure cookies in production
- JWT secret minimum length enforcement

## 8. AI Integration

7 AI-powered features via OpenAI API:

| Feature | Model | Temperature | Rate Limit |
|---------|-------|-------------|------------|
| Goal Suggestions | gpt-3.5-turbo | default | moderate |
| Goal Enhancement | gpt-3.5-turbo | default | -- |
| Personalized Goals | gpt-4o-mini | default | moderate |
| Risk Analysis | gpt-4o-mini | 0.3 | moderate |
| Performance Insights | gpt-4o-mini | default | moderate |
| Feedback Improvement | gpt-4o-mini | default | moderate |
| Performance Reviews | gpt-4o-mini | default | moderate |

All advanced features use JSON response format. Lazy client initialization.

## 9. Frontend Architecture

### Rendering Strategy
- All pages are client components (`'use client'`)
- No server-side rendering or data loading
- Client-side `fetch()` to `/api/*` routes

### Layout System
- `DashboardLayout` — shared sidebar nav, header, user menu, portal switching
- `PageContainer` -> `PageHeader` -> `StatsSection` -> content area
- `PageToolbar` + `FilterSelect` for filtering/search

### Component Hierarchy
```
Providers (Session > Theme > Settings)
  DashboardLayout (sidebar + header)
    PageContainer
      PageHeader + StatsSection
      PageToolbar + FilterSelect + Filters
      GoalsTable / GoalCard (grid) / RatingGoalCard
      GoalDetailModal / GoalFormModal / DeleteConfirmationModal
      AI Components (suggestions, risk, insights, writing)
      AnalyticsCharts / PerformanceTable
      EventsTable / EventParticipationCard
      Pagination
```

### Design System
- Semantic CSS custom properties (RGB triplet format) in `globals.css`
- 100+ CSS variables covering surfaces, text, borders, accent, status, categories, priorities, ratings
- Light/dark theme with class-based switching
- Utility classes: `bg-surface-*`, `text-primary`, `text-accent`, `focus-ring`, `shadow-theme-*`
- Pre-built classes: `card-glass`, `card-accent`, `input-theme`, `modal-overlay`

### State Management
- Local `useState` hooks exclusively (no global state library)
- Optimistic updates: UI updates immediately, reconciles with server response, rolls back on error
- Server-side pagination on all list pages

## 10. Infrastructure

### Local Development
- Docker Compose: PostgreSQL 15 (port 5434) + pgAdmin (port 5050)
- Next.js dev server on port 3000

### Production Build
- Multi-stage Docker (3 stages): deps -> builder -> runner
- Next.js standalone output mode for minimal image size
- Runs as non-root `nextjs` user (UID 1001)
- Exposes port 3000

### Azure Deployment (Pulumi IaC)
- Resource Group: `rg-hearts-app` (Southeast Asia)
- App Service Plan: Linux B1 tier, Node.js 18 LTS
- PostgreSQL Flexible Server: Standard_B1ms, 32GB storage, 7-day backup
- Firewall: Azure-internal access

## 11. Monitoring & Observability

- **Azure Application Insights** — Optional, lazy-loaded, server-side only
- **Logger singleton** — Traces, exceptions, custom events, metrics, dependency tracking
- **PII redaction** — Keys containing password/token/secret/auth/email/id are sanitized
- **Performance monitor** — In-memory metrics for queries (5s threshold) and APIs (3s threshold)
- **`withPerformanceTracking()`** — HOF adding `X-Response-Time` and `X-Performance-Alert` headers
- **Health endpoint** — `/api/health` with DB connectivity check (SELECT 1)

## 12. Testing

- **Framework:** Vitest with node environment
- **Tests:** `__tests__/validation.test.ts` (29 cases), `__tests__/security.test.ts` (6 cases)
- **Coverage:** Zod schema validation (all goal/rating/status schemas), XSS sanitization
- **Gaps:** No E2E tests, no integration tests, no API route tests
- **Run:** `npm test` (single run), `npm run test:watch` (watch mode)
