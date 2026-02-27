-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_resourceId_fkey";

-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "resourceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
