-- Manual migration: Add learner_course_state table for Step 15
-- This is a safe, additive-only migration

CREATE TABLE IF NOT EXISTS "learner_course_state" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lastUnitId" TEXT,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_course_state_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "learner_course_state_userId_courseId_key" ON "learner_course_state"("userId", "courseId");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "learner_course_state_userId_idx" ON "learner_course_state"("userId");
CREATE INDEX IF NOT EXISTS "learner_course_state_courseId_idx" ON "learner_course_state"("courseId");

-- Add foreign keys
ALTER TABLE "learner_course_state" ADD CONSTRAINT "learner_course_state_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_course_state" ADD CONSTRAINT "learner_course_state_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learner_course_state" ADD CONSTRAINT "learner_course_state_lastUnitId_fkey" FOREIGN KEY ("lastUnitId") REFERENCES "course_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
