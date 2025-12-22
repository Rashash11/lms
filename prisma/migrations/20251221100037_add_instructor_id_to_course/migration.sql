/*
  Warnings:

  - You are about to drop the column `key` on the `groups` table. All the data in the column will be lost.
  - You are about to alter the column `description` on the `groups` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - A unique constraint covering the columns `[groupKey]` on the table `groups` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "groups_key_key";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "instructorId" TEXT;

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "key",
ADD COLUMN     "autoEnroll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "price" DECIMAL(10,2),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- CreateIndex
CREATE UNIQUE INDEX "groups_groupKey_key" ON "groups"("groupKey");
