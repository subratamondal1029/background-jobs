-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'RETRYING';

-- AlterTable
ALTER TABLE "images" ALTER COLUMN "previewKey" DROP NOT NULL;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "retries" INTEGER NOT NULL DEFAULT 0;
