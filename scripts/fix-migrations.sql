-- ============================================
-- HEARTS APP - DATABASE RECOVERY SCRIPT
-- ============================================
-- This script fixes the migration issues and ensures all tables exist
-- Run this in your PostgreSQL database directly
-- ============================================

-- Step 1: Mark failed migrations as rolled back in _prisma_migrations table
DELETE FROM "_prisma_migrations" WHERE migration_name = '20250103000000_add_performance_indexes' AND finished_at IS NULL;
DELETE FROM "_prisma_migrations" WHERE migration_name = '20250103000001_complete_schema_sync' AND finished_at IS NULL;

-- Step 2: Create all required enums
DO $$ BEGIN
 CREATE TYPE "Role" AS ENUM('ADMIN', 'MANAGER', 'EMPLOYEE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "GoalStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'MODIFIED', 'COMPLETED', 'DRAFT', 'DELETED', 'IN_PROGRESS', 'NOT_STARTED', 'ON_HOLD', 'BLOCKED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "GoalCategory" AS ENUM('PROFESSIONAL', 'TECHNICAL', 'LEADERSHIP', 'PERSONAL', 'TRAINING', 'KPI');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "ProgressStatus" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "NotificationType" AS ENUM('GOAL_CREATED', 'GOAL_UPDATED', 'GOAL_APPROVED', 'GOAL_REJECTED', 'GOAL_MODIFIED', 'GOAL_COMPLETED', 'GOAL_DELETED', 'RATING_RECEIVED', 'REVIEW_CYCLE_CREATED', 'REVIEW_CYCLE_UPDATED', 'REVIEW_CYCLE_DELETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "EventType" AS ENUM ('TOASTMASTERS', 'CODECRUNCH', 'HEART_TALKS', 'BISTEC_CLUB', 'WORKSHOP', 'TRAINING', 'SEMINAR', 'NETWORKING', 'TEAM_BUILDING', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "ParticipationStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'NO_SHOW', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create all required tables
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginAttempt" TIMESTAMP(3),
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" TEXT,
    "managerId" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,
    "employeeId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'DRAFT',
    "managerComments" TEXT,
    "category" "GoalCategory" NOT NULL DEFAULT 'PROFESSIONAL',
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedById" TEXT,
    "lastProgressUpdate" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progressStatus" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressNotes" TEXT,
    "department" TEXT NOT NULL DEFAULT 'ENGINEERING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "selfScore" INTEGER,
    "selfComments" TEXT,
    "selfRatedById" TEXT,
    "selfRatedAt" TIMESTAMP(3),
    "managerScore" INTEGER,
    "managerComments" TEXT,
    "managerRatedById" TEXT,
    "managerRatedAt" TIMESTAMP(3),
    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReviewCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportingPersonId" TEXT,
    "jobCategory" TEXT,
    "designation" TEXT,
    "dateOfAppointment" TIMESTAMP(3),
    "after6Months" TEXT,
    "reviewMonth" TEXT,
    "adjustedReviewMonth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EventParticipation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participationStatus" "ParticipationStatus" NOT NULL DEFAULT 'REGISTERED',
    "hoursContributed" DOUBLE PRECISION,
    "feedback" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

-- Step 4: Add unique constraints
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Rating" ADD CONSTRAINT "Rating_goalId_key" UNIQUE ("goalId");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_userId_key" UNIQUE ("userId");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_userId_key" UNIQUE ("eventId", "userId");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 5: Add foreign keys
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Goal" ADD CONSTRAINT "Goal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Goal" ADD CONSTRAINT "Goal_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Goal" ADD CONSTRAINT "Goal_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Goal" ADD CONSTRAINT "Goal_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Rating" ADD CONSTRAINT "Rating_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Rating" ADD CONSTRAINT "Rating_selfRatedById_fkey" FOREIGN KEY ("selfRatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Rating" ADD CONSTRAINT "Rating_managerRatedById_fkey" FOREIGN KEY ("managerRatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Notification" ADD CONSTRAINT "Notification_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 6: Create all indexes
CREATE INDEX IF NOT EXISTS "User_managerId_idx" ON "User"("managerId");
CREATE INDEX IF NOT EXISTS "User_lastLoginAt_idx" ON "User"("lastLoginAttempt");
CREATE INDEX IF NOT EXISTS "User_lastLoginAttempt_idx" ON "User"("lastLoginAttempt");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User"("department");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_name_idx" ON "User"("name");
CREATE INDEX IF NOT EXISTS "User_role_isActive_idx" ON "User"("role", "isActive");
CREATE INDEX IF NOT EXISTS "User_managerId_isActive_idx" ON "User"("managerId", "isActive");
CREATE INDEX IF NOT EXISTS "User_department_isActive_idx" ON "User"("department", "isActive");
CREATE INDEX IF NOT EXISTS "User_role_department_idx" ON "User"("role", "department");

CREATE INDEX IF NOT EXISTS "Goal_managerId_idx" ON "Goal"("managerId");
CREATE INDEX IF NOT EXISTS "Goal_employeeId_idx" ON "Goal"("employeeId");
CREATE INDEX IF NOT EXISTS "Goal_createdById_idx" ON "Goal"("createdById");
CREATE INDEX IF NOT EXISTS "Goal_updatedById_idx" ON "Goal"("updatedById");
CREATE INDEX IF NOT EXISTS "Goal_deletedById_idx" ON "Goal"("deletedById");
CREATE INDEX IF NOT EXISTS "Goal_status_idx" ON "Goal"("status");
CREATE INDEX IF NOT EXISTS "Goal_category_idx" ON "Goal"("category");
CREATE INDEX IF NOT EXISTS "Goal_priority_idx" ON "Goal"("priority");
CREATE INDEX IF NOT EXISTS "Goal_department_idx" ON "Goal"("department");
CREATE INDEX IF NOT EXISTS "Goal_createdAt_idx" ON "Goal"("createdAt");
CREATE INDEX IF NOT EXISTS "Goal_dueDate_idx" ON "Goal"("dueDate");
CREATE INDEX IF NOT EXISTS "Goal_progressStatus_idx" ON "Goal"("progressStatus");
CREATE INDEX IF NOT EXISTS "Goal_status_employeeId_idx" ON "Goal"("status", "employeeId");
CREATE INDEX IF NOT EXISTS "Goal_status_managerId_idx" ON "Goal"("status", "managerId");
CREATE INDEX IF NOT EXISTS "Goal_employeeId_status_idx" ON "Goal"("employeeId", "status");
CREATE INDEX IF NOT EXISTS "Goal_category_status_idx" ON "Goal"("category", "status");
CREATE INDEX IF NOT EXISTS "Goal_department_status_idx" ON "Goal"("department", "status");
CREATE INDEX IF NOT EXISTS "Goal_status_dueDate_idx" ON "Goal"("status", "dueDate");
CREATE INDEX IF NOT EXISTS "Goal_employeeId_dueDate_idx" ON "Goal"("employeeId", "dueDate");
CREATE INDEX IF NOT EXISTS "Goal_status_createdAt_idx" ON "Goal"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Goal_employeeId_status_createdAt_dueDate_idx" ON "Goal"("employeeId", "status", "createdAt", "dueDate");
CREATE INDEX IF NOT EXISTS "Goal_managerId_status_createdAt_idx" ON "Goal"("managerId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Goal_status_createdAt_dueDate_idx" ON "Goal"("status", "createdAt", "dueDate");

CREATE INDEX IF NOT EXISTS "Rating_goalId_idx" ON "Rating"("goalId");
CREATE INDEX IF NOT EXISTS "Rating_selfRatedById_idx" ON "Rating"("selfRatedById");
CREATE INDEX IF NOT EXISTS "Rating_managerRatedById_idx" ON "Rating"("managerRatedById");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_goalId_idx" ON "Notification"("goalId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

CREATE INDEX IF NOT EXISTS "ReviewCycle_userId_idx" ON "ReviewCycle"("userId");
CREATE INDEX IF NOT EXISTS "ReviewCycle_updatedById_idx" ON "ReviewCycle"("updatedById");
CREATE INDEX IF NOT EXISTS "ReviewCycle_reportingPersonId_idx" ON "ReviewCycle"("reportingPersonId");

CREATE INDEX IF NOT EXISTS "Event_createdById_idx" ON "Event"("createdById");
CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status");
CREATE INDEX IF NOT EXISTS "Event_eventType_idx" ON "Event"("eventType");
CREATE INDEX IF NOT EXISTS "Event_startDate_idx" ON "Event"("startDate");
CREATE INDEX IF NOT EXISTS "Event_endDate_idx" ON "Event"("endDate");
CREATE INDEX IF NOT EXISTS "Event_status_startDate_idx" ON "Event"("status", "startDate");
CREATE INDEX IF NOT EXISTS "Event_eventType_status_idx" ON "Event"("eventType", "status");

CREATE INDEX IF NOT EXISTS "EventParticipation_eventId_idx" ON "EventParticipation"("eventId");
CREATE INDEX IF NOT EXISTS "EventParticipation_userId_idx" ON "EventParticipation"("userId");
CREATE INDEX IF NOT EXISTS "EventParticipation_participationStatus_idx" ON "EventParticipation"("participationStatus");
CREATE INDEX IF NOT EXISTS "EventParticipation_eventId_participationStatus_idx" ON "EventParticipation"("eventId", "participationStatus");
CREATE INDEX IF NOT EXISTS "EventParticipation_userId_participationStatus_idx" ON "EventParticipation"("userId", "participationStatus");

-- Step 7: Mark migrations as completed if not already done
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
SELECT gen_random_uuid()::text, 'checksum', now(), '20250103000000_add_performance_indexes', NULL, NULL, now() - interval '1 hour', 0
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20250103000000_add_performance_indexes');

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
SELECT gen_random_uuid()::text, 'checksum', now(), '20250103000001_complete_schema_sync', NULL, NULL, now() - interval '59 minutes', 0
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20250103000001_complete_schema_sync');

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
SELECT gen_random_uuid()::text, 'checksum', now(), '20260205000000_add_event_management', NULL, NULL, now() - interval '58 minutes', 0
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20260205000000_add_event_management');

-- Recovery complete
SELECT 'Database recovery completed successfully!' as status;
