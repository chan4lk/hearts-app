-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('PROFESSIONAL', 'TECHNICAL', 'LEADERSHIP', 'PERSONAL', 'TRAINING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GoalStatus" ADD VALUE 'DRAFT';
ALTER TYPE "GoalStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "category" "GoalCategory" NOT NULL DEFAULT 'PROFESSIONAL',
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- CreateIndex
CREATE INDEX "Goal_createdById_idx" ON "Goal"("createdById");

-- CreateIndex
CREATE INDEX "Goal_updatedById_idx" ON "Goal"("updatedById");

-- CreateIndex
CREATE INDEX "Goal_deletedById_idx" ON "Goal"("deletedById");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
