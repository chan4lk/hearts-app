# Data Models — Bistec AspireHub

## Overview

- **Database:** PostgreSQL 15
- **ORM:** Prisma 6.10.1
- **Active Models:** 7
- **Enums:** 8
- **Migrations:** 16
- **Primary Keys:** CUID strings (`@default(cuid())`)

---

## Enums

### Role
`ADMIN` | `MANAGER` | `EMPLOYEE`

### GoalStatus
`PENDING` | `APPROVED` | `REJECTED` | `MODIFIED` | `COMPLETED` | `DRAFT` | `DELETED` | `IN_PROGRESS` | `ON_HOLD` | `BLOCKED`

### GoalCategory
`PROFESSIONAL` | `TECHNICAL` | `LEADERSHIP` | `PERSONAL` | `TRAINING` | `KPI`

### ProgressStatus
`NOT_STARTED` | `IN_PROGRESS` | `ON_HOLD` | `BLOCKED` | `COMPLETED`

### NotificationType
`GOAL_CREATED` | `GOAL_UPDATED` | `GOAL_APPROVED` | `GOAL_REJECTED` | `GOAL_MODIFIED` | `GOAL_COMPLETED` | `GOAL_DELETED` | `RATING_RECEIVED` | `REVIEW_CYCLE_CREATED` | `REVIEW_CYCLE_UPDATED` | `REVIEW_CYCLE_DELETED`

### EventType
`TOASTMASTERS` | `CODECRUNCH` | `RBT_TRAINING` | `TRAINING` | `HEART_TALKS` | `BISTEC_CLUB` | `WORKSHOP` | `SEMINAR` | `NETWORKING` | `TEAM_BUILDING` | `OTHER`

### EventStatus
`SCHEDULED` | `ONGOING` | `COMPLETED` | `CANCELLED`

### ParticipationStatus
`REGISTERED` | `ATTENDED` | `NO_SHOW` | `CANCELLED`

---

## Models

### User

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | `@id @default(cuid())` |
| email | String | `@unique` |
| name | String | required |
| role | Role | `@default(EMPLOYEE)` |
| password | String | required (bcrypt hash) |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| failedLoginAttempts | Int | `@default(0)` |
| lastLoginAt | DateTime? | nullable |
| lastLoginAttempt | DateTime? | nullable |
| department | String? | nullable |
| isActive | Boolean | `@default(true)` |
| position | String? | nullable |
| managerId | String? | nullable, self-referencing FK |

**Indexes (12):** `managerId`, `role`, `department`, `isActive`, `createdAt`, `name`, `[role, isActive]`, `[managerId, isActive]`, `[department, isActive]`, `[role, department]`, `[isActive, createdAt]`, `[failedLoginAttempts]`

**Relations:** Self-referential (manager/subordinates), Goals (as employee/manager/creator/updater/deleter), Ratings (as self/manager rater), Notifications, ReviewCycles, Events (as creator), EventParticipations

### Goal

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | `@id @default(cuid())` |
| title | String | required |
| description | String | required |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| dueDate | DateTime | required |
| managerId | String? | FK -> User |
| employeeId | String | FK -> User |
| approvedAt | DateTime? | nullable |
| approvedBy | String? | nullable (plain text, not FK) |
| rejectedAt | DateTime? | nullable |
| rejectedBy | String? | nullable (plain text, not FK) |
| status | GoalStatus | `@default(DRAFT)` |
| managerComments | String? | nullable |
| category | GoalCategory | `@default(PROFESSIONAL)` |
| createdById | String? | FK -> User |
| deletedAt | DateTime? | soft delete timestamp |
| deletedById | String? | FK -> User |
| updatedById | String? | FK -> User |
| lastProgressUpdate | DateTime? | nullable |
| progress | Float | `@default(0)` |
| progressStatus | ProgressStatus | `@default(NOT_STARTED)` |
| progressNotes | String? | nullable |
| department | String | `@default("ENGINEERING")` |
| priority | String | `@default("MEDIUM")` |

**Indexes (18+):** `managerId`, `employeeId`, `createdById`, `updatedById`, `deletedById`, `status`, `category`, `priority`, `department`, `createdAt`, `dueDate`, `[status, employeeId]`, `[status, managerId]`, `[employeeId, status]`, `[category, status]`, `[department, status]`, `[status, dueDate]`, `[employeeId, dueDate]`, `[status, createdAt]`, `[employeeId, status, createdAt, dueDate]`, `[managerId, status, createdAt]`, `[status, createdAt, dueDate]`

### Rating

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | `@id @default(cuid())` |
| goalId | String | `@unique` (one rating per goal) |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| selfScore | Int? | 1-5 scale |
| selfComments | String? | nullable |
| selfRatedById | String? | FK -> User |
| selfRatedAt | DateTime? | nullable |
| managerScore | Int? | 1-5 scale |
| managerComments | String? | nullable |
| managerRatedById | String? | FK -> User |
| managerRatedAt | DateTime? | nullable |

**Note:** Legacy columns `score` (Int) and `comments` (Text) exist in the database but are not in the current Prisma schema.

### Notification

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | `@id @default(cuid())` |
| type | NotificationType | required |
| message | String | required (sanitized via `sanitizeInput()`) |
| isRead | Boolean | `@default(false)` |
| createdAt | DateTime | `@default(now())` |
| userId | String | FK -> User |
| goalId | String? | FK -> Goal |

**Indexes (7):** `userId`, `goalId`, `isRead`, `createdAt`, `type`, `[userId, isRead]`, `[userId, createdAt]`, `[userId, isRead, createdAt]`

### ReviewCycle

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | `@id @default(cuid())` |
| userId | String | `@unique` (one cycle per user) |
| reportingPersonId | String? | FK -> User |
| jobCategory | String? | e.g. "Executive", "Senior Executive" |
| designation | String? | e.g. "Senior Software Engineer" |
| dateOfAppointment | DateTime? | company join date |
| after6Months | String? | month name |
| reviewMonth | String? | month name |
| adjustedReviewMonth | String? | month name |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| updatedById | String? | FK -> User |

### Event

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | `@id @default(cuid())` |
| title | String | required |
| description | String | required |
| eventType | EventType | required |
| categoryLabel | String? | custom category when eventType=OTHER |
| location | String? | nullable |
| startDate | DateTime | required |
| endDate | DateTime | required |
| capacity | Int? | nullable |
| registrationDeadline | DateTime | required |
| createdById | String | FK -> User |
| status | EventStatus | `@default(SCHEDULED)` |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |

**Indexes (7):** `createdById`, `status`, `eventType`, `startDate`, `endDate`, `[status, startDate]`, `[eventType, status]`

### EventParticipation

| Field | Type | Constraints |
|-------|------|-------------|
| id | String | `@id @default(cuid())` |
| eventId | String | FK -> Event (CASCADE delete) |
| userId | String | FK -> User (CASCADE delete) |
| participationStatus | ParticipationStatus | `@default(REGISTERED)` |
| toastmasterRole | String? | role for TOASTMASTERS events |
| heartsTalkRole | String? | PARTICIPANT or FACILITATOR |
| hoursContributed | Float? | nullable |
| feedback | String? | nullable |
| registeredAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |

**Unique constraint:** `@@unique([eventId, userId])`

---

## Relationships

### One-to-One (1:1)

| From | To | FK Field | Notes |
|------|----|----------|-------|
| Rating | Goal | `goalId` (UNIQUE) | Each goal has at most one rating |
| ReviewCycle | User | `userId` (UNIQUE) | Each user has at most one review cycle |

### One-to-Many (1:N)

| Parent (1) | Child (N) | FK in Child | On Delete |
|-----------|----------|-------------|-----------|
| User | User (self) | `managerId` | SET NULL |
| User | Goal (as employee) | `employeeId` | RESTRICT |
| User | Goal (as manager) | `managerId` | SET NULL |
| User | Goal (as creator) | `createdById` | SET NULL |
| User | Goal (as updater) | `updatedById` | SET NULL |
| User | Goal (as deleter) | `deletedById` | SET NULL |
| User | Rating (as selfRater) | `selfRatedById` | SET NULL |
| User | Rating (as managerRater) | `managerRatedById` | SET NULL |
| User | Notification | `userId` | RESTRICT |
| Goal | Notification | `goalId` | SET NULL |
| User | ReviewCycle (as reportingPerson) | `reportingPersonId` | SET NULL |
| User | ReviewCycle (as updater) | `updatedById` | SET NULL |
| User | Event (as creator) | `createdById` | RESTRICT |
| Event | EventParticipation | `eventId` | CASCADE |
| User | EventParticipation | `userId` | CASCADE |

### Many-to-Many (N:N)

| Entities | Via | Constraint |
|----------|-----|-----------|
| User <-> Event | EventParticipation | `@@unique([eventId, userId])` |

---

## Goal Status State Machine

```
DRAFT --> PENDING --> APPROVED --> IN_PROGRESS --> COMPLETED
                 \-> REJECTED --> DRAFT (revise)
                 \-> MODIFIED --> PENDING (resubmit)
                              \-> ON_HOLD / BLOCKED --> IN_PROGRESS
```

**Role-based transitions:**
- **Employee:** IN_PROGRESS, ON_HOLD, BLOCKED, COMPLETED (work statuses only)
- **Manager:** APPROVED, REJECTED, MODIFIED (approval statuses, direct reports only)
- **Admin:** Unrestricted transitions

---

## Migration History

| # | Migration | Date | Summary |
|---|-----------|------|---------|
| 1 | `add_notifications` | 2025-04-08 | Initial: User, Goal, Rating, Feedback, Notification |
| 2 | `update_feedback_model` | 2025-04-10 | Restructure Feedback table |
| 3 | `add_user_activity_fields` | 2025-04-10 | Login tracking fields |
| 4 | `add_system_settings` | 2025-04-10 | User dept/status/position; SystemSettings table |
| 5 | `add_missing_goal_columns` | 2025-12-04 | Category, progress, priority, soft delete |
| 6 | `update_rating_table` | 2025-12-04 | Dual rating system (self + manager) |
| 7 | `add_goal_status_enum_values` | 2025-12-04 | DRAFT, DELETED, IN_PROGRESS, ON_HOLD, BLOCKED |
| 8 | `update_manager_goals_to_approved` | 2025-12-04 | Data migration: PENDING -> APPROVED |
| 9 | `fix_self_rated_by_id_nullable` | 2025-12-04 | Make rater IDs nullable |
| 10 | `make_old_rating_columns_nullable` | 2025-12-04 | Legacy score/comments nullable |
| 11 | `add_performance_indexes` | 2025-01-03 | Composite indexes for dashboards |
| 12 | `complete_schema_sync` | 2025-01-03 | Full schema sync + ReviewCycle table |
| 13 | `add_email_reminder_system` | 2025-01-05 | Email reminder tables (later orphaned) |
| 14 | `add_event_management` | 2026-02-05 | Event + EventParticipation tables |
| 15 | `add_event_category_and_participation_roles` | 2026-02-08 | RBT_TRAINING, categoryLabel, roles |
| 16 | `remove_not_started_and_redundant_indexes` | 2026-03-22 | NOT_STARTED -> DRAFT migration, index cleanup |

---

## Orphaned Tables

The following tables exist in the database but have been removed from the Prisma schema:

| Table | Created By | Notes |
|-------|-----------|-------|
| Feedback | Initial migration | Columns: id, content, fromId, toId, status. Model removed. |
| SystemSettings | Migration #4 | JSONB fields for notification/review/security settings. Singleton pattern. |
| EmailReminderSettings | Migration #13 | SMTP config + reminder toggles |
| EmailReminderLog | Migration #13 | Email send log with type, recipient, status |

---

## Seed Data

### Official seed (`prisma/seed.ts`)
Creates 3 users via `upsert` (idempotent):
- **Admin:** admin@example.com / admin123 (ADMIN)
- **Manager:** manager@example.com / manager123 (MANAGER)
- **Employee:** employee@example.com / employee123 (EMPLOYEE, managed by Manager)

### Alternative seed (`scripts/seed-db.js`)
Same 3 users plus 2 sample events (Toastmasters Meeting, Code Crunch Workshop).
