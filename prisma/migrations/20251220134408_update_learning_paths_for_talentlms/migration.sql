/*
  Warnings:

  - You are about to drop the column `categoryId` on the `learning_paths` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "learning_path_courses" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "learning_paths" DROP COLUMN "categoryId",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'inactive',
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "completionRule" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
