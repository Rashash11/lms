/*
  Warnings:

  - You are about to drop the column `body` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `enabled` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `recurringConfig` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `rulesets` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `smartTags` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `eventKey` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageBody` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageSubject` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientType` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "body",
DROP COLUMN "enabled",
DROP COLUMN "eventType",
DROP COLUMN "isRecurring",
DROP COLUMN "recurringConfig",
DROP COLUMN "rulesets",
DROP COLUMN "smartTags",
DROP COLUMN "subject",
ADD COLUMN     "eventKey" TEXT NOT NULL,
ADD COLUMN     "filterBranches" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "filterCourses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "filterGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hoursOffset" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messageBody" TEXT NOT NULL,
ADD COLUMN     "messageSubject" TEXT NOT NULL,
ADD COLUMN     "offsetDirection" TEXT,
ADD COLUMN     "recipientType" TEXT NOT NULL,
ADD COLUMN     "recipientUserId" TEXT;

-- CreateTable
CREATE TABLE "notification_history" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "eventKey" TEXT NOT NULL,
    "contextJson" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_queue_status_scheduledFor_idx" ON "notification_queue"("status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
