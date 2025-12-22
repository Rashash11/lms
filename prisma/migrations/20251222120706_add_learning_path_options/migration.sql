/*
  Warnings:

  - The `completionRule` column on the `learning_paths` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CourseOrderMode" AS ENUM ('SEQUENTIAL', 'ANY');

-- CreateEnum
CREATE TYPE "CompletionRule" AS ENUM ('ALL_COURSES_COMPLETED');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('CLASSIC', 'FANCY', 'MODERN', 'SIMPLE');

-- AlterTable
ALTER TABLE "learning_paths" ADD COLUMN     "accessRetentionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificateType" "CertificateType",
ADD COLUMN     "completionDaysLimit" INTEGER,
ADD COLUMN     "courseOrderMode" "CourseOrderMode" NOT NULL DEFAULT 'ANY',
DROP COLUMN "completionRule",
ADD COLUMN     "completionRule" "CompletionRule" NOT NULL DEFAULT 'ALL_COURSES_COMPLETED';
