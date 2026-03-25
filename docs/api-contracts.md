# API Contracts — Bistec AspireHub

**Total:** 46 route files, 68 HTTP handlers across 12 route groups.

---

## Authentication Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth | -- | -- | NextAuth handler (Azure AD + Credentials) |
| `/api/auth/login` | POST | Public | strict | -- | Email/password login, tracks failed attempts, account lockout |
| `/api/auth/register` | POST | Public | moderate | -- | Creates user with EMPLOYEE role, bcrypt hash |

## Admin Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/admin/activities` | GET | ADMIN | -- | -- | 15 most recent activities (users + goals merged) |
| `/api/admin/events` | GET, POST | ADMIN | -- | -- | Paginated event listing with search; event creation |
| `/api/admin/events/[eventId]` | GET, PUT, DELETE | ADMIN | -- | -- | Individual event CRUD; includes participations on GET |
| `/api/admin/goals/stats` | GET | ADMIN | -- | -- | Goal stats via groupBy aggregation + user counts |
| `/api/admin/review-cycles` | GET, POST, DELETE | ADMIN | -- | -- | Review cycle CRUD with upsert; creates notifications |
| `/api/admin/review-cycles/export` | GET | ADMIN | -- | -- | Excel (.xlsx) download of all review cycles |
| `/api/admin/review-cycles/import` | POST | ADMIN | -- | -- | Excel/CSV upload; matches users by first name; upserts cycles |
| `/api/admin/stats` | GET | ADMIN | -- | -- | System dashboard: user counts, role distribution, active sessions |
| `/api/admin/users` | GET, POST, PUT, DELETE | ADMIN | moderate (POST/PUT) | -- | Full user CRUD; circular manager detection; cascading delete |
| `/api/admin/users/password` | PUT | ADMIN | strict | -- | Password reset; optional current password verification |
| `/api/admin/users/validate-manager` | POST | ADMIN | -- | Yes | Validates manager hierarchy won't create circular reference |

## AI Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/ai/generate-goal` | POST | Authenticated | moderate | -- | Goal suggestions from prompt + category (gpt-3.5-turbo) |
| `/api/ai/goal-risk-analysis` | POST | Goal owner/manager/ADMIN | moderate | -- | Risk assessment: completion probability, risk factors (gpt-4o-mini) |
| `/api/ai/improve-feedback` | POST | Authenticated | moderate | -- | Tone-aware feedback rewriting (constructive/encouraging/professional) |
| `/api/ai/performance-insights` | POST | Self or ADMIN/MANAGER | moderate | -- | AI performance analysis with metrics (gpt-4o-mini) |
| `/api/ai/personalized-goals` | POST | Authenticated | moderate | -- | Profile-based goal recommendations (gpt-4o-mini) |
| `/api/ai/review-automation` | POST | MANAGER/ADMIN | moderate | -- | Automated performance review generation (gpt-4o-mini) |

## Analytics Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/analytics/dashboard` | GET | Role-scoped | -- | -- | 7 parallel groupBy queries; EMPLOYEE=own, MANAGER=team, ADMIN=all; 503+Retry-After on connection limit |

## Employee Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/employees` | GET | ADMIN/MANAGER | -- | -- | ADMIN=all employees; MANAGER=direct reports; includes goal counts |
| `/api/employees/assigned` | GET | ADMIN/MANAGER | -- | -- | Manager's direct reports with pagination |

## Event Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/events` | GET | Authenticated | -- | -- | Browse events with participation status and participant count |
| `/api/events/participation` | GET, POST | Authenticated | -- | -- | GET=own participations; POST=register/update (upsert by eventId+userId) |

## Goal Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/goals` | GET, POST, DELETE, PATCH | Role-based | moderate (POST/DELETE/PATCH) | Yes (POST) | Unified goals API with view-based filtering; state machine enforcement |
| `/api/goals/[goalId]` | GET, PATCH, PUT, DELETE | Role-based | moderate (PATCH/PUT/DELETE) | -- | Individual goal CRUD; soft delete; employee reassignment |
| `/api/goals/[goalId]/activity` | GET | Goal owner/manager/ADMIN | -- | -- | Activity timeline from goal data |
| `/api/goals/[goalId]/approve` | PUT | MANAGER/ADMIN | -- | Yes | Approves PENDING/DRAFT goals; MANAGER=direct reports only |
| `/api/goals/[goalId]/reject` | PUT | MANAGER/ADMIN | -- | Yes | Rejects PENDING/DRAFT goals; MANAGER=direct reports only |
| `/api/goals/[goalId]/due-date` | PATCH | Owner/manager/ADMIN | -- | -- | Due date update with cross-role notifications |
| `/api/goals/[goalId]/priority` | PATCH | Owner/manager/ADMIN | -- | -- | Priority update (LOW/MEDIUM/HIGH/URGENT) with notifications |
| `/api/goals/[goalId]/progress` | PUT | Employee only | moderate | Yes | Progress 0-100; auto-determines progressStatus; notifies manager |
| `/api/goals/[goalId]/status` | PATCH | Role-based transitions | -- | Yes | Comprehensive transition rules by role; employees=work statuses, managers=approve/reject |
| `/api/goals/[goalId]/self-rating` | POST | Employee only | -- | Yes | Upsert self-rating 0-5; score=0 clears; notifies manager |
| `/api/goals/[goalId]/manager-rating` | POST | MANAGER/ADMIN | -- | Yes | Upsert manager rating 0-5; MANAGER=direct reports only |
| `/api/goals/[goalId]/ratings` | GET, POST | Authenticated | -- | -- | Rating read/write with type parameter (self/manager) |
| `/api/goals/ai-suggestions` | POST | Authenticated | moderate | Yes | AI goal suggestions by category |
| `/api/goals/bulk` | GET, POST | MANAGER/ADMIN | bulk (POST) | -- | Bulk creation up to 50 goals; per-employee notifications |

## Notification Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/notifications` | GET, PATCH, DELETE | Own only | -- | -- | Paginated; PATCH=mark read; DELETE=remove |

## Rating Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/ratings/manager` | POST | MANAGER/ADMIN | moderate | -- | Batch manager ratings in transaction; MANAGER=direct reports |
| `/api/ratings/self` | POST | Authenticated | -- | -- | Batch self-ratings; verifies goal ownership |

## Report Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/reports/generate` | POST | Authenticated | -- | -- | JSON/PDF report (dashboard/performance/goals) |

## User Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/users` | GET, POST | ADMIN | -- | -- | Active users (limit 500); user creation with password hash |

## Health Routes

| Endpoint | Methods | Auth | Rate Limit | Zod | Description |
|----------|---------|------|------------|-----|-------------|
| `/api/health` | GET | Public | -- | -- | DB connectivity check (SELECT 1); 200=healthy, 503=unhealthy |

---

## Rate Limiting Summary

| Tier | Limit | Window | Routes |
|------|-------|--------|--------|
| strict | 5 requests | 15 min | `/api/auth/login`, `/api/admin/users/password` |
| moderate | 30 requests | 1 min | AI routes, goal mutations, user mutations, batch ratings |
| standard | 60 requests | 1 min | General API (default) |
| lenient | 100 requests | 1 min | Read operations |
| bulk | 10 requests | 5 min | `/api/goals/bulk` |

Implementation: In-memory store, IP-based (`x-forwarded-for`/`x-real-ip`). Returns 429 with `Retry-After` and `X-RateLimit-*` headers. Auto-cleanup every 5 minutes. Redis recommended for production.

## Zod Validated Routes

| Schema | Routes |
|--------|--------|
| `createGoalSchema` | POST `/api/goals` |
| `statusUpdateSchema` | PATCH `/api/goals/[goalId]/status` |
| `progressUpdateSchema` | PUT `/api/goals/[goalId]/progress` |
| `ratingSubmitSchema` | POST `/api/goals/[goalId]/self-rating`, `/api/goals/[goalId]/manager-rating` |
| `approveRejectSchema` | PUT `/api/goals/[goalId]/approve`, `/api/goals/[goalId]/reject` |
| `validateManagerSchema` | POST `/api/admin/users/validate-manager` |
| custom `requestSchema` | POST `/api/goals/ai-suggestions` |

## Common Response Patterns

- **Success:** `{ success: true, data?, message? }`
- **Paginated:** `{ items, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`
- **Error:** `{ error: string }` with appropriate HTTP status
- **Auth failure:** 401 `{ error: "Unauthorized" }` or redirect to `/login`
- **Forbidden:** 403 `{ error: "Forbidden" }` or `{ error: "Access denied" }`
- **Rate limited:** 429 with `Retry-After` header
