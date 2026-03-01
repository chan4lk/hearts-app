-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FeedbackRoundType" AS ENUM ('THREE_MONTH', 'ANNUAL');

-- CreateEnum
CREATE TYPE "FeedbackRoundStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeedbackReviewStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('THREE_MONTH_REVIEW', 'SIX_MONTH_REVIEW', 'ANNUAL_REVIEW', 'FEEDBACK_DISCUSSION', 'GENERAL');

-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('NEW_JOINER_FEEDBACK');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "ExitInterviewStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "GoalCategory" ADD VALUE 'KPI';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GoalStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "GoalStatus" ADD VALUE 'NOT_STARTED';
ALTER TYPE "GoalStatus" ADD VALUE 'ON_HOLD';
ALTER TYPE "GoalStatus" ADD VALUE 'BLOCKED';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('GOAL_CREATED', 'GOAL_UPDATED', 'GOAL_APPROVED', 'GOAL_REJECTED', 'GOAL_MODIFIED', 'GOAL_COMPLETED', 'GOAL_DELETED', 'RATING_RECEIVED', 'REVIEW_CYCLE_CREATED', 'REVIEW_CYCLE_UPDATED', 'REVIEW_CYCLE_DELETED', 'FEEDBACK_ROUND_CREATED', 'FEEDBACK_REVIEW_REQUESTED', 'FEEDBACK_REVIEW_SUBMITTED', 'FEEDBACK_ROUND_COMPLETED', 'MEETING_MINUTES_CREATED', 'SURVEY_REQUESTED', 'SURVEY_SUBMITTED', 'RATING_CYCLE_REMINDER', 'RATING_CYCLE_COMPLETE', 'GOAL_RENEWAL_DUE', 'EXIT_INTERVIEW_CREATED', 'EXIT_INTERVIEW_COMPLETED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_fromId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_toId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_selfRatedById_fkey";

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "department" TEXT NOT NULL DEFAULT 'ENGINEERING',
ADD COLUMN     "lastProgressUpdate" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "progressNotes" TEXT,
ADD COLUMN     "progressStatus" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "comments",
DROP COLUMN "score",
ADD COLUMN     "managerComments" TEXT,
ADD COLUMN     "managerRatedAt" TIMESTAMP(3),
ADD COLUMN     "managerScore" INTEGER,
ADD COLUMN     "selfComments" TEXT,
ADD COLUMN     "selfRatedAt" TIMESTAMP(3),
ADD COLUMN     "selfScore" INTEGER,
ALTER COLUMN "selfRatedById" DROP NOT NULL;

-- DropTable
DROP TABLE "Feedback";

-- DropTable
DROP TABLE "SystemSettings";

-- CreateTable
CREATE TABLE "ReviewCycle" (
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

-- CreateTable
CREATE TABLE "FeedbackRound" (
    "id" TEXT NOT NULL,
    "type" "FeedbackRoundType" NOT NULL,
    "employeeId" TEXT NOT NULL,
    "initiatedById" TEXT NOT NULL,
    "status" "FeedbackRoundStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackReview" (
    "id" TEXT NOT NULL,
    "feedbackRoundId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "score" INTEGER,
    "comments" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "status" "FeedbackReviewStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMinutes" (
    "id" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "feedbackRoundId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "actionItems" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingMinutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSurvey" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "SurveyType" NOT NULL,
    "responses" JSONB,
    "status" "SurveyStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExitInterview" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "ExitInterviewStatus" NOT NULL DEFAULT 'PENDING',
    "responses" JSONB,
    "notes" TEXT,
    "conductedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExitInterview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCycle_userId_key" ON "ReviewCycle"("userId");

-- CreateIndex
CREATE INDEX "ReviewCycle_userId_idx" ON "ReviewCycle"("userId");

-- CreateIndex
CREATE INDEX "ReviewCycle_updatedById_idx" ON "ReviewCycle"("updatedById");

-- CreateIndex
CREATE INDEX "ReviewCycle_reportingPersonId_idx" ON "ReviewCycle"("reportingPersonId");

-- CreateIndex
CREATE INDEX "FeedbackRound_employeeId_idx" ON "FeedbackRound"("employeeId");

-- CreateIndex
CREATE INDEX "FeedbackRound_initiatedById_idx" ON "FeedbackRound"("initiatedById");

-- CreateIndex
CREATE INDEX "FeedbackRound_status_idx" ON "FeedbackRound"("status");

-- CreateIndex
CREATE INDEX "FeedbackReview_feedbackRoundId_idx" ON "FeedbackReview"("feedbackRoundId");

-- CreateIndex
CREATE INDEX "FeedbackReview_reviewerId_idx" ON "FeedbackReview"("reviewerId");

-- CreateIndex
CREATE INDEX "FeedbackReview_status_idx" ON "FeedbackReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackReview_feedbackRoundId_reviewerId_key" ON "FeedbackReview"("feedbackRoundId", "reviewerId");

-- CreateIndex
CREATE INDEX "MeetingMinutes_employeeId_idx" ON "MeetingMinutes"("employeeId");

-- CreateIndex
CREATE INDEX "MeetingMinutes_managerId_idx" ON "MeetingMinutes"("managerId");

-- CreateIndex
CREATE INDEX "MeetingMinutes_feedbackRoundId_idx" ON "MeetingMinutes"("feedbackRoundId");

-- CreateIndex
CREATE INDEX "MeetingMinutes_date_idx" ON "MeetingMinutes"("date");

-- CreateIndex
CREATE INDEX "EmployeeSurvey_employeeId_idx" ON "EmployeeSurvey"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeSurvey_status_idx" ON "EmployeeSurvey"("status");

-- CreateIndex
CREATE INDEX "EmployeeSurvey_type_idx" ON "EmployeeSurvey"("type");

-- CreateIndex
CREATE INDEX "ExitInterview_employeeId_idx" ON "ExitInterview"("employeeId");

-- CreateIndex
CREATE INDEX "ExitInterview_managerId_idx" ON "ExitInterview"("managerId");

-- CreateIndex
CREATE INDEX "ExitInterview_status_idx" ON "ExitInterview"("status");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "Goal_category_idx" ON "Goal"("category");

-- CreateIndex
CREATE INDEX "Goal_priority_idx" ON "Goal"("priority");

-- CreateIndex
CREATE INDEX "Goal_department_idx" ON "Goal"("department");

-- CreateIndex
CREATE INDEX "Goal_createdAt_idx" ON "Goal"("createdAt");

-- CreateIndex
CREATE INDEX "Goal_dueDate_idx" ON "Goal"("dueDate");

-- CreateIndex
CREATE INDEX "Goal_progressStatus_idx" ON "Goal"("progressStatus");

-- CreateIndex
CREATE INDEX "Goal_status_employeeId_idx" ON "Goal"("status", "employeeId");

-- CreateIndex
CREATE INDEX "Goal_status_managerId_idx" ON "Goal"("status", "managerId");

-- CreateIndex
CREATE INDEX "Goal_employeeId_status_idx" ON "Goal"("employeeId", "status");

-- CreateIndex
CREATE INDEX "Goal_category_status_idx" ON "Goal"("category", "status");

-- CreateIndex
CREATE INDEX "Goal_department_status_idx" ON "Goal"("department", "status");

-- CreateIndex
CREATE INDEX "Goal_status_dueDate_idx" ON "Goal"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Goal_employeeId_dueDate_idx" ON "Goal"("employeeId", "dueDate");

-- CreateIndex
CREATE INDEX "Goal_status_createdAt_idx" ON "Goal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_goalId_key" ON "Rating"("goalId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_managerId_isActive_idx" ON "User"("managerId", "isActive");

-- CreateIndex
CREATE INDEX "User_department_isActive_idx" ON "User"("department", "isActive");

-- CreateIndex
CREATE INDEX "User_role_department_idx" ON "User"("role", "department");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_selfRatedById_fkey" FOREIGN KEY ("selfRatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRound" ADD CONSTRAINT "FeedbackRound_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRound" ADD CONSTRAINT "FeedbackRound_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackReview" ADD CONSTRAINT "FeedbackReview_feedbackRoundId_fkey" FOREIGN KEY ("feedbackRoundId") REFERENCES "FeedbackRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackReview" ADD CONSTRAINT "FeedbackReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMinutes" ADD CONSTRAINT "MeetingMinutes_feedbackRoundId_fkey" FOREIGN KEY ("feedbackRoundId") REFERENCES "FeedbackRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSurvey" ADD CONSTRAINT "EmployeeSurvey_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitInterview" ADD CONSTRAINT "ExitInterview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitInterview" ADD CONSTRAINT "ExitInterview_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

