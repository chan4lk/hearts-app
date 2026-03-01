# Bistec AspireHub - Data Models

**Generated:** 2026-02-28 | **Database:** PostgreSQL 15 | **ORM:** Prisma 6.10.1

## Database Schema Overview

The application uses 10 core tables with a self-referencing user hierarchy, 360 feedback system, meeting/survey tracking, and comprehensive indexing for performance.

## Entity Relationship Diagram

```
┌───────────────┐     ┌───────────────────┐     ┌──────────────┐
│     User      │────<│       Goal        │────<│ Notification │
│               │     │                   │     │              │
│ id (PK)       │     │ id (PK)           │     │ id (PK)      │
│ email (UQ)    │     │ title             │     │ type         │
│ name          │     │ description       │     │ message      │
│ role (enum)   │     │ status (enum)     │     │ isRead       │
│ password      │     │ category (enum)   │     │ userId (FK)  │
│ department    │     │ priority          │     │ goalId (FK)  │
│ position      │     │ department        │     │ createdAt    │
│ isActive      │     │ progress (0-100)  │     └──────────────┘
│ managerId(FK) │──┐  │ progressStatus    │
│ failedLogins  │  │  │ dueDate           │     ┌──────────────┐
│ lastLoginAt   │  │  │ employeeId (FK)   │     │   Rating     │
│ createdAt     │  │  │ managerId (FK)    │     │              │
│ updatedAt     │  │  │ createdById (FK)  │     │ id (PK)      │
└───────┬───────┘  │  │ updatedById (FK)  │     │ goalId (UQ)  │
        │          │  │ deletedById (FK)  │────>│ selfScore    │
        │          │  │ deletedAt         │     │ selfComments │
        └──────────┘  │ approvedAt        │     │ selfRatedBy  │
   (self-referencing  │ approvedBy        │     │ managerScore │
    manager-employee) │ rejectedAt        │     │ managerComm. │
                      │ managerComments   │     │ managerRated │
                      │ createdAt         │     │ createdAt    │
                      │ updatedAt         │     │ updatedAt    │
                      └───────────────────┘     └──────────────┘

┌───────────────────┐
│   ReviewCycle     │
│                   │
│ id (PK)           │
│ userId (UQ, FK)   │
│ reportingPersonId │
│ jobCategory       │
│ designation       │
│ dateOfAppointment │
│ after6Months      │
│ reviewMonth       │
│ adjustedReviewMo. │
│ createdAt         │
│ updatedAt         │
│ updatedById (FK)  │
└───────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  FeedbackRound   │────<│  FeedbackReview  │
│                  │     │                  │
│ id (PK)          │     │ id (PK)          │
│ type (enum)      │     │ feedbackRoundId  │
│ employeeId (FK)  │     │ reviewerId (FK)  │
│ initiatedById    │     │ score (1-5)      │
│ status (enum)    │     │ comments         │
│ completedAt      │     │ strengths        │
│ createdAt        │     │ improvements     │
│ updatedAt        │     │ status (enum)    │
└──────────────────┘     │ submittedAt      │
                         │ @@unique(round+  │
                         │  reviewer)       │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ MeetingMinutes   │     │ EmployeeSurvey   │
│                  │     │                  │
│ id (PK)          │     │ id (PK)          │
│ type (enum)      │     │ employeeId (FK)  │
│ employeeId (FK)  │     │ type (enum)      │
│ managerId (FK)   │     │ responses (JSON) │
│ feedbackRoundId  │     │ status (enum)    │
│ date             │     │ submittedAt      │
│ notes            │     │ createdAt        │
│ actionItems      │     │ updatedAt        │
│ nextSteps        │     └──────────────────┘
│ createdAt        │
│ updatedAt        │     ┌──────────────────┐
└──────────────────┘     │  ExitInterview   │
                         │                  │
                         │ id (PK)          │
                         │ employeeId (FK)  │
                         │ managerId (FK)   │
                         │ departureDate    │
                         │ reason           │
                         │ status (enum)    │
                         │ responses (JSON) │
                         │ notes            │
                         │ conductedAt      │
                         │ createdAt        │
                         │ updatedAt        │
                         └──────────────────┘
```

## Table Definitions

### User

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| email | String | UNIQUE, NOT NULL | User email address |
| name | String | NOT NULL | Display name |
| role | Role (enum) | NOT NULL, DEFAULT EMPLOYEE | ADMIN, MANAGER, EMPLOYEE |
| password | String | NOT NULL | Bcrypt hashed password |
| department | String | NULL | Department name |
| position | String | NULL | Job title/position |
| isActive | Boolean | DEFAULT true | Active status |
| managerId | String | FK → User.id, NULL | Self-referencing manager |
| failedLoginAttempts | Int | DEFAULT 0 | Login failure counter |
| lastLoginAt | DateTime | NULL | Last successful login |
| lastLoginAttempt | DateTime | NULL | Last login attempt |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:**
- `@@index([managerId])` - Manager lookups
- `@@index([role])`, `@@index([department])`, `@@index([isActive])` - Filtering
- `@@index([role, isActive])` - Active users by role
- `@@index([managerId, isActive])` - Active employees for manager
- `@@index([department, isActive])` - Active users by department
- `@@index([role, department])` - Users by role and department

**Relations:**
- `manager` → User (many-to-one via managerId)
- `employees` → User[] (one-to-many, inverse of manager)
- `createdGoals`, `deletedGoals`, `goals`, `managerGoals`, `updatedGoals` → Goal[]
- `notifications` → Notification[]
- `selfRatings`, `managerRatings` → Rating[]
- `reviewCycle` → ReviewCycle (1:1)
- `feedbackRoundsAsEmployee` → FeedbackRound[] (rounds where user is the employee)
- `feedbackRoundsInitiated` → FeedbackRound[] (rounds initiated by this user)
- `feedbackReviews` → FeedbackReview[] (reviews written by this user)
- `meetingsAsEmployee`, `meetingsAsManager` → MeetingMinutes[]
- `surveys` → EmployeeSurvey[]
- `exitInterviewsAsEmployee`, `exitInterviewsAsManager` → ExitInterview[]

---

### Goal

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| title | String | NOT NULL | Goal title |
| description | String | NOT NULL | Goal description |
| status | GoalStatus (enum) | DEFAULT DRAFT | Current workflow status |
| category | GoalCategory (enum) | DEFAULT PROFESSIONAL | Goal category |
| priority | String | DEFAULT "MEDIUM" | URGENT, HIGH, MEDIUM, LOW |
| department | String | DEFAULT "ENGINEERING" | Department scope |
| progress | Float | DEFAULT 0 | Completion percentage (0-100) |
| progressStatus | ProgressStatus (enum) | DEFAULT NOT_STARTED | Progress state |
| progressNotes | String | NULL | Progress update notes |
| lastProgressUpdate | DateTime | NULL | Last progress change |
| dueDate | DateTime | NOT NULL | Target completion date |
| employeeId | String | FK → User.id, NOT NULL | Goal owner |
| managerId | String | FK → User.id, NULL | Assigned manager |
| createdById | String | FK → User.id, NULL | Creator |
| updatedById | String | FK → User.id, NULL | Last updater |
| deletedById | String | FK → User.id, NULL | Who soft-deleted |
| deletedAt | DateTime | NULL | Soft-delete timestamp |
| approvedAt | DateTime | NULL | Approval timestamp |
| approvedBy | String | NULL | Approver reference |
| rejectedAt | DateTime | NULL | Rejection timestamp |
| rejectedBy | String | NULL | Rejector reference |
| managerComments | String | NULL | Manager feedback |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:**
- FK indexes on all foreign keys
- `@@index([status])`, `@@index([category])`, `@@index([priority])`, `@@index([department])`
- `@@index([status, employeeId])` - Goals by status for an employee
- `@@index([status, managerId])` - Goals by status for a manager
- `@@index([category, status])` - Filter by category and status
- `@@index([department, status])` - Filter by department and status
- `@@index([status, dueDate])` - Find overdue goals
- `@@index([employeeId, dueDate])` - Employee goals by due date

---

### Rating

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| goalId | String | UNIQUE, FK → Goal.id | One rating per goal |
| selfScore | Int | NULL | Employee self-rating (1-5) |
| selfComments | String | NULL | Employee comments |
| selfRatedById | String | FK → User.id, NULL | Self-rater |
| selfRatedAt | DateTime | NULL | Self-rating timestamp |
| managerScore | Int | NULL | Manager rating (1-5) |
| managerComments | String | NULL | Manager feedback |
| managerRatedById | String | FK → User.id, NULL | Manager rater |
| managerRatedAt | DateTime | NULL | Manager rating timestamp |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:** `@@index([goalId])`, `@@index([selfRatedById])`, `@@index([managerRatedById])`

---

### Notification

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| type | NotificationType (enum) | NOT NULL | Event type |
| message | String | NOT NULL | Notification text |
| isRead | Boolean | DEFAULT false | Read status |
| userId | String | FK → User.id, NOT NULL | Recipient |
| goalId | String | FK → Goal.id, NULL | Related goal |
| createdAt | DateTime | DEFAULT now() | Created timestamp |

**Indexes:**
- `@@index([userId, isRead])` - Unread notifications for user
- `@@index([userId, createdAt])` - User notifications by date
- `@@index([userId, isRead, createdAt])` - Optimized unread query

---

### ReviewCycle

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| userId | String | UNIQUE, FK → User.id | One cycle per user |
| reportingPersonId | String | FK → User.id, NULL | Reporting manager |
| jobCategory | String | NULL | Executive, Senior Executive, etc. |
| designation | String | NULL | Job title |
| dateOfAppointment | DateTime | NULL | Join date |
| after6Months | String | NULL | 6-month review month name |
| reviewMonth | String | NULL | Annual review month |
| adjustedReviewMonth | String | NULL | Adjusted review month |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |
| updatedById | String | FK → User.id, NULL | Last updater |

---

### FeedbackRound

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| type | FeedbackRoundType (enum) | NOT NULL | THREE_MONTH or ANNUAL |
| employeeId | String | FK → User.id, NOT NULL | Employee being reviewed |
| initiatedById | String | FK → User.id, NOT NULL | Manager who initiated |
| status | FeedbackRoundStatus (enum) | DEFAULT PENDING | Round status |
| completedAt | DateTime | NULL | When round was completed |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:** `@@index([employeeId])`, `@@index([initiatedById])`, `@@index([status])`

**Relations:**
- `employee` → User (many-to-one)
- `initiatedBy` → User (many-to-one)
- `reviews` → FeedbackReview[] (one-to-many, cascade delete)
- `meetingMinutes` → MeetingMinutes[] (one-to-many)

---

### FeedbackReview

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| feedbackRoundId | String | FK → FeedbackRound.id, NOT NULL | Parent round |
| reviewerId | String | FK → User.id, NOT NULL | Reviewer |
| score | Int | NULL | Rating score (1-5) |
| comments | String | NULL | Reviewer comments |
| strengths | String | NULL | Employee strengths noted |
| improvements | String | NULL | Areas for improvement |
| status | FeedbackReviewStatus (enum) | DEFAULT PENDING | Review status |
| submittedAt | DateTime | NULL | Submission timestamp |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:** `@@index([feedbackRoundId])`, `@@index([reviewerId])`, `@@index([status])`
**Unique Constraint:** `@@unique([feedbackRoundId, reviewerId])` - One review per reviewer per round

---

### MeetingMinutes

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| type | MeetingType (enum) | NOT NULL | Meeting category |
| employeeId | String | FK → User.id, NOT NULL | Employee discussed |
| managerId | String | FK → User.id, NOT NULL | Meeting conductor |
| feedbackRoundId | String | FK → FeedbackRound.id, NULL | Linked feedback round |
| date | DateTime | NOT NULL | Meeting date |
| notes | String | NOT NULL | Meeting notes |
| actionItems | String | NULL | Action items from meeting |
| nextSteps | String | NULL | Planned next steps |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:** `@@index([employeeId])`, `@@index([managerId])`, `@@index([feedbackRoundId])`, `@@index([date])`

---

### EmployeeSurvey

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| employeeId | String | FK → User.id, NOT NULL | Survey respondent |
| type | SurveyType (enum) | NOT NULL | NEW_JOINER_FEEDBACK |
| responses | Json | NULL | Survey response data |
| status | SurveyStatus (enum) | DEFAULT PENDING | Submission status |
| submittedAt | DateTime | NULL | Submission timestamp |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:** `@@index([employeeId])`, `@@index([status])`, `@@index([type])`

---

### ExitInterview

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| employeeId | String | FK → User.id, NOT NULL | Departing employee |
| managerId | String | FK → User.id, NOT NULL | Conducting manager |
| departureDate | DateTime | NOT NULL | Expected departure date |
| reason | String | NULL | Departure reason |
| status | ExitInterviewStatus (enum) | DEFAULT PENDING | Interview status |
| responses | Json | NULL | Interview responses |
| notes | String | NULL | Manager notes |
| conductedAt | DateTime | NULL | Interview completion date |
| createdAt | DateTime | DEFAULT now() | Created timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Indexes:** `@@index([employeeId])`, `@@index([managerId])`, `@@index([status])`

---

## Enums

### Role
`ADMIN` | `MANAGER` | `EMPLOYEE`

### GoalStatus
`DRAFT` | `PENDING` | `APPROVED` | `REJECTED` | `MODIFIED` | `IN_PROGRESS` | `NOT_STARTED` | `ON_HOLD` | `BLOCKED` | `COMPLETED` | `DELETED`

### GoalCategory
`PROFESSIONAL` | `TECHNICAL` | `LEADERSHIP` | `PERSONAL` | `TRAINING` | `KPI`

### ProgressStatus
`NOT_STARTED` | `IN_PROGRESS` | `ON_HOLD` | `BLOCKED` | `COMPLETED`

### NotificationType
`GOAL_CREATED` | `GOAL_UPDATED` | `GOAL_APPROVED` | `GOAL_REJECTED` | `GOAL_MODIFIED` | `GOAL_COMPLETED` | `GOAL_DELETED` | `RATING_RECEIVED` | `REVIEW_CYCLE_CREATED` | `REVIEW_CYCLE_UPDATED` | `REVIEW_CYCLE_DELETED` | `FEEDBACK_ROUND_CREATED` | `FEEDBACK_REVIEW_REQUESTED` | `FEEDBACK_REVIEW_SUBMITTED` | `FEEDBACK_ROUND_COMPLETED` | `MEETING_MINUTES_CREATED` | `SURVEY_REQUESTED` | `SURVEY_SUBMITTED` | `RATING_CYCLE_REMINDER` | `RATING_CYCLE_COMPLETE` | `GOAL_RENEWAL_DUE` | `EXIT_INTERVIEW_CREATED` | `EXIT_INTERVIEW_COMPLETED`

### FeedbackRoundType
`THREE_MONTH` | `ANNUAL`

### FeedbackRoundStatus
`PENDING` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`

### FeedbackReviewStatus
`PENDING` | `SUBMITTED`

### MeetingType
`THREE_MONTH_REVIEW` | `SIX_MONTH_REVIEW` | `ANNUAL_REVIEW` | `FEEDBACK_DISCUSSION` | `GENERAL`

### SurveyType
`NEW_JOINER_FEEDBACK`

### SurveyStatus
`PENDING` | `SUBMITTED`

### ExitInterviewStatus
`PENDING` | `SCHEDULED` | `COMPLETED` | `CANCELLED`

## Migrations History

| Migration | Date | Description |
|---|---|---|
| 20250408092204 | 2025-04-08 | Add notifications model |
| 20250410024224 | 2025-04-10 | Update feedback model |
| 20250410044946 | 2025-04-10 | Add user activity fields |
| 20250410060836 | 2025-04-10 | Add system settings |
| 20250620173158 | 2025-06-20 | Fix goal relation |
| 20260301072600 | 2026-03-01 | Add feedback rounds, reviews, meeting minutes, surveys, exit interviews |

## Seed Data

The database seed (`prisma/seed.ts`) creates 3 test users:
1. **Admin:** admin@example.com / admin123 (Role: ADMIN)
2. **Manager:** manager@example.com / manager123 (Role: MANAGER)
3. **Employee:** employee@example.com / employee123 (Role: EMPLOYEE, managed by Manager)
