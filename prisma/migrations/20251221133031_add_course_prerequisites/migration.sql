-- CreateEnum
CREATE TYPE "UnlockType" AS ENUM ('NONE', 'AFTER_COURSE', 'AFTER_SCORE');

-- AlterTable
ALTER TABLE "learning_path_courses" ADD COLUMN     "minScore" INTEGER,
ADD COLUMN     "unlockCourseId" TEXT,
ADD COLUMN     "unlockType" "UnlockType" NOT NULL DEFAULT 'NONE';
