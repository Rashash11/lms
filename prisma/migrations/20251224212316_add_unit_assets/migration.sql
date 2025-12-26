/*
  Warnings:

  - You are about to drop the column `order` on the `course_sections` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `course_units` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `course_units` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `courses` table. All the data in the column will be lost.
  - Added the required column `order_index` to the `course_sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `config` to the `course_units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_index` to the `course_units` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "course_sections" DROP COLUMN "order",
ADD COLUMN     "order_index" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "course_units" DROP COLUMN "content",
DROP COLUMN "order",
ADD COLUMN     "config" JSONB NOT NULL,
ADD COLUMN     "order_index" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "image",
ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "thumbnail_url" TEXT;

-- CreateTable
CREATE TABLE "unit_assets" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "name" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_assets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "unit_assets" ADD CONSTRAINT "unit_assets_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_assets" ADD CONSTRAINT "unit_assets_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "course_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
