/*
  Warnings:

  - You are about to drop the column `employeeId` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `managerId` on the `Goal` table. All the data in the column will be lost.
  - The `status` column on the `Goal` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_managerId_fkey";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "employeeId",
DROP COLUMN "managerId",
DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "GoalStatus";
