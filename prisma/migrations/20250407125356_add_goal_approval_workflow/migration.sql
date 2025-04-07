/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('PENDING', 'APPROVED', 'NEEDS_MODIFICATION', 'MODIFIED', 'COMPLETED');
ALTER TABLE "Goal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Goal" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "Goal" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "managerId" TEXT;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
