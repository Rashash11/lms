-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "subtitle" TEXT;

-- AlterTable
ALTER TABLE "enrollment_requests" ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedBy" TEXT;
