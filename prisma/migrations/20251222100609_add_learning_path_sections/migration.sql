-- AlterTable
ALTER TABLE "learning_path_courses" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "learning_path_sections" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_path_sections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "learning_path_sections" ADD CONSTRAINT "learning_path_sections_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "learning_path_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
