/*
  Warnings:

  - You are about to drop the column `givenById` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `goalId` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `Feedback` table. All the data in the column will be lost.
  - Added the required column `fromId` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toId` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_givenById_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_goalId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_receiverId_fkey";

-- DropIndex
DROP INDEX "Feedback_givenById_idx";

-- DropIndex
DROP INDEX "Feedback_goalId_idx";

-- DropIndex
DROP INDEX "Feedback_receiverId_idx";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "givenById",
DROP COLUMN "goalId",
DROP COLUMN "receiverId",
ADD COLUMN     "fromId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "toId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Feedback_fromId_idx" ON "Feedback"("fromId");

-- CreateIndex
CREATE INDEX "Feedback_toId_idx" ON "Feedback"("toId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
