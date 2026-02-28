# Bistec AspireHub - API Contracts

**Generated:** 2026-02-28 | **Scan Level:** Deep | **Total Endpoints:** 50

All API routes use Next.js App Router convention (`app/api/[domain]/route.ts`). Authentication is via NextAuth.js session (JWT cookie). All endpoints return JSON.

---

## Authentication (`/api/auth/`)

### GET, POST /api/auth/[...nextauth]
NextAuth.js handler (Azure AD + Credentials).
- **Auth:** Public
- **Runtime:** Node.js, force-dynamic
- Handles: login/logout/callback/session flows

### POST /api/auth/login
Email/password authentication with JWT token generation.
- **Auth:** Public
- **Body:** `{ email: string, password: string }`
- **Response:** `{ user: UserWithoutPassword, message: string }` + HttpOnly JWT cookie
- **Features:** Failed login tracking, account deactivation check

### POST /api/auth/register
Create new user account.
- **Auth:** Public
- **Body:** `{ name: string, email: string, password: string }`
- **Response:** `{ user: UserWithoutPassword, message: string }` (201)
- **Features:** Case-insensitive email, bcrypt hashing, duplicate prevention

### GET /api/auth/debug
Debug environment and auth status.
- **Auth:** ADMIN + Development mode only
- **Response:** `{ status, environment, session }`
- **Security:** Returns only presence flags, not actual secret values

---

## Admin (`/api/admin/`)

### GET /api/admin/activities
Fetch 15 most recent user and goal activities.
- **Auth:** ADMIN
- **Response:** Activities array with timestamps and status changes

### GET /api/admin/stats
Comprehensive admin dashboard metrics.
- **Auth:** ADMIN
- **Response:** `{ userCounts (by role), goalStats (by status), activeSessions (30min), securityAlerts (inactive 24hrs+), roleDistribution }`

### GET /api/admin/goals/stats
Goal-focused statistics with breakdown.
- **Auth:** ADMIN
- **Response:** Goal status counts, user statistics, activity timeline

### GET, POST, PUT, DELETE /api/admin/users
Full user management CRUD.
- **Auth:** ADMIN
- **GET Params:** `role`, `isActive`, `department`, `managerId`, `search`, `sortBy`, `sortOrder`, `minimal`
- **POST Body:** `{ name, email, password, role, managerId?, isActive? }`
- **PUT Body:** Same as POST with `id`
- **Features:** Case-insensitive email, circular manager prevention, user cascade deletion

### PUT /api/admin/users/password
Admin password reset for any user.
- **Auth:** ADMIN
- **Rate Limit:** Strict (security critical)
- **Body:** `{ userId, currentPassword?, newPassword }`
- **Response:** `{ success: true, message }`

### GET, POST, PUT, DELETE /api/admin/review-cycles
Review cycle management.
- **Auth:** ADMIN
- **GET Params:** `page`, `limit`, `userId`, `reportingPersonId`, `search`, `sortBy`, `sortOrder`
- **POST Body:** `{ userId, reportingPersonId?, jobCategory?, designation?, dateOfAppointment?, after6Months?, reviewMonth?, adjustedReviewMonth? }`
- **Features:** Upsert by userId, notification creation

### GET /api/admin/review-cycles/export
Export all review cycles as Excel (.xlsx) file.
- **Auth:** ADMIN
- **Response:** Binary Excel file
- **Filename:** `review-cycles-YYYY-MM-DD.xlsx`

### POST /api/admin/review-cycles/import
Import review cycles from Excel/CSV (multipart/form-data).
- **Auth:** ADMIN
- **Body:** FormData with file upload (.xlsx, .xls, .csv)
- **Response:** `{ success, imported, skipped, skippedUsers, importedUsers, reportData }`
- **Features:** Fuzzy name matching, date parsing, validation, error reporting

---

## Users (`/api/users/`)

### GET, POST /api/users
User listing (ADMIN) and public creation.
- **GET Auth:** ADMIN
- **POST Auth:** Public
- **Response:** Users with manager and managed employees relations

---

## Employees (`/api/employees/`)

### GET /api/employees
Employees list with approval status counts.
- **Auth:** ADMIN or MANAGER
- **Response:** Employees with goal counts, manager info, active status

### GET /api/employees/assigned
Manager's assigned employees (paginated).
- **Auth:** ADMIN or MANAGER
- **Params:** `managerId` (for admin viewing specific manager)
- **Response:** Employees with goal counts + pagination metadata

---

## Goals (`/api/goals/`)

### GET, POST, DELETE, PATCH /api/goals
Unified goals API with role-based views.
- **Auth:** Authenticated
- **GET Params:** `view` (my-goals|team-goals|pending-approval|all), `status`, `employeeId`, `category`, `priority`, `search`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortOrder`
- **POST Body:** `{ title, description, category, dueDate, employeeId?, department?, priority? }`
- **Status Workflow:** DRAFT → PENDING → APPROVED/REJECTED/MODIFIED → IN_PROGRESS → COMPLETED
- **Features:** Soft delete, notifications on all status changes

### GET /api/goals/approved
Approved goals for current employee.
- **Auth:** Employee
- **Response:** Goals with rating information

### GET /api/goals/pending
Pending goals requiring manager review.
- **Auth:** MANAGER or ADMIN
- **Params:** `managerId` (for admin)
- **Response:** Pending goals with audit info

### GET /api/goals/manager
Completed goals of managed employees (for rating).
- **Auth:** MANAGER or ADMIN
- **Response:** Goals with rating information

### POST /api/goals/bulk
Bulk goal creation (max 50 per batch).
- **Auth:** MANAGER or ADMIN
- **Rate Limit:** Bulk (strict)
- **Body:** `{ goals: Array<{ title, description, dueDate, employeeId, category, department?, priority? }> }`
- **Response:** `{ success, created, failed, goals }` (201)
- **Features:** Transaction-based, validation per goal

### POST /api/goals/ai-suggestions
AI goal suggestions by category.
- **Auth:** Authenticated
- **Rate Limit:** Moderate
- **Body:** `{ category: string, context?: string }`
- **Response:** `{ suggestions: string[] }`

### POST /api/goals/seed
Seed sample goals (development only).
- **Auth:** None
- **Response:** `{ message, count, ids }`

### GET /api/goals/[goalId]
Get single goal with all relations.
- **Auth:** Employee (own) or ADMIN
- **Response:** Full goal with employee, manager, rating

### PUT /api/goals/[goalId]
Update goal details.
- **Auth:** ADMIN, goal manager, or goal employee (if DRAFT/PENDING)
- **Body:** `{ title?, description?, category?, dueDate?, department?, priority?, employeeId? }`
- **Features:** Notifications to involved parties

### PATCH /api/goals/[goalId]
Update goal status with validation.
- **Auth:** Role-dependent (employees and managers)
- **Body:** `{ status: GoalStatus }`
- **Features:** Status transition validation, comprehensive notifications

### PATCH /api/goals/[goalId]/status
Alternative status update endpoint.
- **Auth:** Role-dependent
- **Body:** `{ status: string }`
- **Features:** Notifications based on status change

### PUT /api/goals/[goalId]/progress
Update goal progress (0-100%).
- **Auth:** Goal employee only
- **Rate Limit:** Moderate
- **Body:** `{ progress: number, notes?: string, progressStatus?: "NOT_STARTED"|"IN_PROGRESS"|"ON_HOLD"|"BLOCKED"|"COMPLETED" }`

### PATCH /api/goals/[goalId]/priority
Update goal priority.
- **Auth:** Employee (own), Manager/Admin (managed)
- **Body:** `{ priority: "LOW"|"MEDIUM"|"HIGH"|"URGENT" }`
- **Features:** Cross-party notifications

### PATCH /api/goals/[goalId]/due-date
Update goal due date.
- **Auth:** Employee (own), Manager/Admin (assigned)
- **Body:** `{ dueDate: string (ISO date) }`
- **Features:** Cross-party notifications

### GET /api/goals/[goalId]/activity
Goal activity timeline.
- **Auth:** Goal employee, manager, or admin
- **Response:** Activities array (created, updated, approved, rejected, completed) with timestamps

### PUT /api/goals/[goalId]/approve
Approve pending goal.
- **Auth:** MANAGER or ADMIN
- **Body:** `{ managerComments?: string }`
- **Validation:** Goal must be PENDING or DRAFT

### PUT /api/goals/[goalId]/reject
Reject pending goal.
- **Auth:** MANAGER or ADMIN
- **Body:** `{ managerComments?: string }`
- **Validation:** Goal must be PENDING or DRAFT

### GET, POST /api/goals/[goalId]/ratings
Goal ratings (retrieve/create-update).
- **Auth:** Authenticated
- **POST Body:** `{ score: number (1-5), comments?: string, type: "self"|"manager" }`
- **Features:** One rating per goal (self + manager), upsert pattern

### POST /api/goals/[goalId]/self-rating
Employee self-rate goal.
- **Auth:** Goal employee only
- **Body:** `{ score: number (1-5, or 0 to clear), comments?: string }`
- **Features:** Preserves manager rating when clearing self-rating

### POST /api/goals/[goalId]/manager-rating
Manager rate employee goal.
- **Auth:** MANAGER or ADMIN
- **Body:** `{ score: number (1-5, or 0 to remove), comments?: string }`
- **Validation:** Goal must be APPROVED or COMPLETED
- **Features:** Manager can only rate direct reports (unless ADMIN)

### GET /api/goals/ratings/self
User's submitted ratings.
- **Auth:** Authenticated
- **Response:** Ratings with goal info and both scores

---

## Ratings (`/api/ratings/`)

### POST /api/ratings/self
Batch self-ratings.
- **Auth:** Authenticated
- **Body:** `{ ratings: Array<{ goalId, score, comments }> }`
- **Features:** Batch upsert, manager notification

### POST /api/ratings/manager
Batch manager ratings.
- **Auth:** MANAGER or ADMIN
- **Rate Limit:** Moderate
- **Body:** `{ ratings: Array<{ goalId, score, comments }> }`
- **Features:** Transaction-based, per-employee authorization check, notifications

---

## AI (`/api/ai/`)

### POST /api/ai/generate-goal
Generate a goal from prompt.
- **Auth:** Authenticated
- **Rate Limit:** Moderate
- **Body:** `{ prompt: string, category: string }`

### POST /api/ai/goal-risk-analysis
Analyze goal completion risk.
- **Auth:** Goal employee, manager, or admin
- **Body:** `{ goalId: string }`
- **Response:** `{ success, goalId, goalTitle, analysis }`

### POST /api/ai/improve-feedback
AI writing improvement for feedback text.
- **Auth:** Authenticated
- **Rate Limit:** Moderate
- **Body:** `{ text: string, type: "manager_comment"|"self_rating"|"goal_description", tone?: "constructive"|"encouraging"|"professional" }`
- **Response:** `{ success, original, improved, type, tone }`

### POST /api/ai/performance-insights
Generate performance insights for user.
- **Auth:** Authenticated (own or managed)
- **Body:** `{ userId?: string }`
- **Response:** `{ success, user, metrics, insights }`

### POST /api/ai/personalized-goals
Personalized goal suggestions based on profile.
- **Auth:** Authenticated (own only)
- **Body:** `{ count?: number (default 5) }`
- **Response:** `{ success, suggestions, userProfile }`
- **Features:** Based on role, department, position, performance metrics

### POST /api/ai/review-automation
Generate performance review summary.
- **Auth:** MANAGER or ADMIN
- **Body:** `{ userId: string, period?: string }`
- **Response:** `{ success, user, period, review, metadata }`
- **Features:** Analyzes goals, ratings, strengths, improvement areas

---

## Analytics (`/api/analytics/`)

### GET /api/analytics/dashboard
Comprehensive analytics with role-based scoping.
- **Auth:** Authenticated
- **Params:** `startDate`, `endDate`, `employeeId`, `department`, `context` (admin/manager/employee)
- **Response:** `{ success, summary, breakdowns (status/category/priority/department), trends (monthly), employeePerformance (top 10), meta }`
- **Scoping:** Employee=own, Manager=assigned team, Admin=all

---

## Reports (`/api/reports/`)

### POST /api/reports/generate
Generate reports (JSON or PDF data).
- **Auth:** Authenticated
- **Body:** `{ reportType: "dashboard"|"performance"|"goals", analyticsData?, format: "json"|"pdf", options? }`
- **Response:** `{ success, report, format }`

---

## Notifications (`/api/notifications/`)

### GET /api/notifications
Get user notifications (paginated, newest first).
- **Auth:** Authenticated
- **Params:** `page`, `limit`

### PATCH /api/notifications
Mark notification as read.
- **Auth:** Authenticated (own only)
- **Body:** `{ notificationId: string }`

### DELETE /api/notifications
Delete notification.
- **Auth:** Authenticated (own only)
- **Params:** `id`

---

## Health (`/api/health/`)

### GET /api/health
System health and environment check.
- **Auth:** Public
- **Response:** `{ status, timestamp, checks: { database, environment } }`
- **Status Codes:** 200 (healthy), 503 (unhealthy)

---

## Summary Statistics

| Metric | Count |
|---|---|
| **Total Endpoints** | 50 |
| **Route Groups** | 10 (auth, admin, users, employees, goals, ratings, ai, notifications, analytics, health) |
| **GET endpoints** | 24 |
| **POST endpoints** | 17 |
| **PUT endpoints** | 5 |
| **PATCH endpoints** | 4 |
| **DELETE endpoints** | 4 |
| **Public endpoints** | 4 (register, login, health, seed) |
| **Rate-limited endpoints** | 12 |
| **Notification-triggering** | 15+ |

## Common Error Responses

| Status | Meaning |
|---|---|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - No valid session |
| 403 | Forbidden - Insufficient role |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited (Retry-After header) |
| 500 | Internal Server Error |
| 503 | Service Unavailable - DB connection limit (Retry-After: 5) |

## Rate Limiting Tiers

| Tier | Limit | Used For |
|---|---|---|
| **Strict** | 5 req / 15 min | Auth, password reset |
| **Standard** | 60 req / min | General API |
| **Moderate** | 30 req / min | AI operations, progress updates, ratings |
| **Lenient** | 100 req / min | Read operations |
| **Bulk** | 10 ops / 5 min | Bulk goal creation |
