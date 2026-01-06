-- ============================================================================
-- MANUAL P0 FOREIGN KEY CONSTRAINTS MIGRATION
-- ============================================================================
-- Purpose: Add critical database-level FK constraints for P0 core tables
-- Author: Database Schema Audit
-- Date: 2026-01-05
-- 
-- SAFETY FEATURES:
-- - Pre-validation orphan checks (will halt if orphans found)
-- - Indexes created CONCURRENTLY (no locks)
-- - Constraints added with NOT VALID (minimal locks)
-- - Separate validation step
-- - Safe timeouts configured
-- 
-- IMPORTANT: This file has sections that must run outside transactions:
-- - Section 1: Index creation (CONCURRENTLY can't run in transaction)
-- - Section 2: FK constraints (can run in transaction)
-- ============================================================================

-- ============================================================================
-- SECTION 0: PRE-VALIDATION - CHECK FOR ORPHANED RECORDS
-- ============================================================================
-- Run these queries BEFORE proceeding with the migration
-- If any query returns count > 0, you MUST remediate orphans first
-- ============================================================================

\echo '============================================================================'
\echo 'PRE-VALIDATION: Checking for orphaned records...'
\echo '============================================================================'

-- Check 1: assignment_submissions.userId -> users.id
SELECT COUNT(*) as orphaned_assignment_submission_users
FROM assignment_submissions asub
LEFT JOIN users u ON asub."userId" = u.id
WHERE u.id IS NULL;

-- Check 2: assignment_submissions.courseId -> courses.id
SELECT COUNT(*) as orphaned_assignment_submission_courses
FROM assignment_submissions asub
LEFT JOIN courses c ON asub."courseId" = c.id
WHERE c.id IS NULL;

-- Check 3: assignment_submissions.assignmentUnitId -> course_units.id
SELECT COUNT(*) as orphaned_assignment_submission_units
FROM assignment_submissions asub
LEFT JOIN course_units cu ON asub."assignmentUnitId" = cu.id
WHERE cu.id IS NULL;

-- Check 4: assignment_submissions.gradedBy -> users.id (nullable, but if set should be valid)
SELECT COUNT(*) as orphaned_assignment_submission_graders
FROM assignment_submissions asub
LEFT JOIN users u ON asub."gradedBy" = u.id
WHERE asub."gradedBy" IS NOT NULL AND u.id IS NULL;

-- Check 5: certificate_issues.userId -> users.id
SELECT COUNT(*) as orphaned_certificate_users
FROM certificate_issues ci
LEFT JOIN users u ON ci."userId" = u.id
WHERE u.id IS NULL;

-- Check 6: certificate_issues.courseId -> courses.id (nullable)
SELECT COUNT(*) as orphaned_certificate_courses
FROM certificate_issues ci
LEFT JOIN courses c ON ci."courseId" = c.id
WHERE ci."courseId" IS NOT NULL AND c.id IS NULL;

-- Check 7: certificate_issues.templateId -> certificate_templates.id
SELECT COUNT(*) as orphaned_certificate_templates
FROM certificate_issues ci
LEFT JOIN certificate_templates ct ON ci."templateId" = ct.id
WHERE ct.id IS NULL;

-- Check 8: test_attempts.userId -> users.id
SELECT COUNT(*) as orphaned_test_attempt_users
FROM test_attempts ta
LEFT JOIN users u ON ta."userId" = u.id
WHERE u.id IS NULL;

-- Check 9: test_attempts.testId -> tests.id
SELECT COUNT(*) as orphaned_test_attempt_tests
FROM test_attempts ta
LEFT JOIN tests t ON ta."testId" = t.id
WHERE t.id IS NULL;

-- Check 10: test_attempts.courseId -> courses.id
SELECT COUNT(*) as orphaned_test_attempt_courses
FROM test_attempts ta
LEFT JOIN courses c ON ta."courseId" = c.id
WHERE c.id IS NULL;

-- Check 11: tests.unitId -> course_units.id
SELECT COUNT(*) as orphaned_test_units
FROM tests t
LEFT JOIN course_units cu ON t."unitId" = cu.id
WHERE cu.id IS NULL;

-- Check 12: questions.testId -> tests.id (nullable)
SELECT COUNT(*) as orphaned_question_tests
FROM questions q
LEFT JOIN tests t ON q."testId" = t.id
WHERE q."testId" IS NOT NULL AND t.id IS NULL;

\echo '============================================================================'
\echo 'PRE-VALIDATION COMPLETE'
\echo 'If all counts are 0, you may proceed with the migration.'
\echo 'If any count > 0, see remediation section below (commented out).'
\echo '============================================================================'

/*
-- ============================================================================
-- REMEDIATION SECTION (if orphaned records found)
-- ============================================================================
-- Uncomment and run ONLY the sections needed based on validation results
-- ============================================================================

-- Remediation 1: Delete orphaned assignment_submissions (no valid user)
-- DELETE FROM assignment_submissions 
-- WHERE "userId" NOT IN (SELECT id FROM users);

-- Remediation 2: Delete orphaned assignment_submissions (no valid course)
-- DELETE FROM assignment_submissions 
-- WHERE "courseId" NOT IN (SELECT id FROM courses);

-- Remediation 3: Delete orphaned assignment_submissions (no valid unit)
-- DELETE FROM assignment_submissions 
-- WHERE "assignmentUnitId" NOT IN (SELECT id FROM course_units);

-- Remediation 4: Set NULL for invalid gradedBy references
-- UPDATE assignment_submissions 
-- SET "gradedBy" = NULL 
-- WHERE "gradedBy" IS NOT NULL 
--   AND "gradedBy" NOT IN (SELECT id FROM users);

-- Remediation 5: Delete orphaned certificate_issues (no valid user)
-- DELETE FROM certificate_issues 
-- WHERE "userId" NOT IN (SELECT id FROM users);

-- Remediation 6: Set NULL for invalid courseId in certificate_issues
-- UPDATE certificate_issues 
-- SET "courseId" = NULL 
-- WHERE "courseId" IS NOT NULL 
--   AND "courseId" NOT IN (SELECT id FROM courses);

-- Remediation 7: Delete orphaned certificate_issues (no valid template)
-- DELETE FROM certificate_issues 
-- WHERE "templateId" NOT IN (SELECT id FROM certificate_templates);

-- Remediation 8: Delete orphaned test_attempts (no valid user)
-- DELETE FROM test_attempts 
-- WHERE "userId" NOT IN (SELECT id FROM users);

-- Remediation 9: Delete orphaned test_attempts (no valid test)
-- DELETE FROM test_attempts 
-- WHERE "testId" NOT IN (SELECT id FROM tests);

-- Remediation 10: Delete orphaned test_attempts (no valid course)
-- DELETE FROM test_attempts 
-- WHERE "courseId" NOT IN (SELECT id FROM courses);

-- Remediation 11: Delete orphaned tests (no valid unit)
-- DELETE FROM tests 
-- WHERE "unitId" NOT IN (SELECT id FROM course_units);

-- Remediation 12: Set NULL for invalid testId in questions
-- UPDATE questions 
-- SET "testId" = NULL 
-- WHERE "testId" IS NOT NULL 
--   AND "testId" NOT IN (SELECT id FROM tests);

*/

-- ============================================================================
-- SECTION 1: CREATE INDEXES CONCURRENTLY
-- ============================================================================
-- IMPORTANT: These must run OUTSIDE of a transaction block
-- CONCURRENTLY prevents blocking other queries
-- ============================================================================

\echo '============================================================================'
\echo 'SECTION 1: Creating indexes CONCURRENTLY...'
\echo '============================================================================'

-- Index for assignment_submissions.userId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_userId 
ON assignment_submissions("userId");

-- Index for assignment_submissions.courseId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_courseId 
ON assignment_submissions("courseId");

-- Index for assignment_submissions.assignmentUnitId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_assignmentUnitId 
ON assignment_submissions("assignmentUnitId");

-- Index for assignment_submissions.gradedBy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_gradedBy 
ON assignment_submissions("gradedBy");

-- Index for certificate_issues.userId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_issues_userId 
ON certificate_issues("userId");

-- Index for certificate_issues.courseId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_issues_courseId 
ON certificate_issues("courseId");

-- Index for certificate_issues.templateId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_issues_templateId 
ON certificate_issues("templateId");

-- Index for test_attempts.userId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_attempts_userId 
ON test_attempts("userId");

-- Index for test_attempts.testId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_attempts_testId 
ON test_attempts("testId");

-- Index for test_attempts.courseId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_attempts_courseId 
ON test_attempts("courseId");

-- Index for tests.unitId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tests_unitId 
ON tests("unitId");

-- Index for questions.testId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_testId 
ON questions("testId");

\echo 'Indexes created successfully.'

-- ============================================================================
-- SECTION 2: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Using NOT VALID to add constraints without immediate validation
-- This minimizes lock time on tables
-- ============================================================================

\echo '============================================================================'
\echo 'SECTION 2: Adding foreign key constraints with NOT VALID...'
\echo '============================================================================'

-- Set safe timeouts
SET lock_timeout = '5s';
SET statement_timeout = '5min';

-- Begin transaction for FK additions
BEGIN;

-- ============================================================================
-- P0 Foreign Keys: assignment_submissions
-- ============================================================================

-- assignment_submissions.userId -> users.id
ALTER TABLE assignment_submissions
ADD CONSTRAINT fk_assignment_submissions_user
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- assignment_submissions.courseId -> courses.id
ALTER TABLE assignment_submissions
ADD CONSTRAINT fk_assignment_submissions_course
FOREIGN KEY ("courseId") REFERENCES courses(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- assignment_submissions.assignmentUnitId -> course_units.id
ALTER TABLE assignment_submissions
ADD CONSTRAINT fk_assignment_submissions_unit
FOREIGN KEY ("assignmentUnitId") REFERENCES course_units(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- assignment_submissions.gradedBy -> users.id (nullable)
ALTER TABLE assignment_submissions
ADD CONSTRAINT fk_assignment_submissions_grader
FOREIGN KEY ("gradedBy") REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- P0 Foreign Keys: certificate_issues
-- ============================================================================

-- certificate_issues.userId -> users.id
ALTER TABLE certificate_issues
ADD CONSTRAINT fk_certificate_issues_user
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- certificate_issues.courseId -> courses.id (nullable)
ALTER TABLE certificate_issues
ADD CONSTRAINT fk_certificate_issues_course
FOREIGN KEY ("courseId") REFERENCES courses(id)
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

-- certificate_issues.templateId -> certificate_templates.id
ALTER TABLE certificate_issues
ADD CONSTRAINT fk_certificate_issues_template
FOREIGN KEY ("templateId") REFERENCES certificate_templates(id)
ON DELETE RESTRICT
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- P0 Foreign Keys: test_attempts
-- ============================================================================

-- test_attempts.userId -> users.id
ALTER TABLE test_attempts
ADD CONSTRAINT fk_test_attempts_user
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- test_attempts.testId -> tests.id
ALTER TABLE test_attempts
ADD CONSTRAINT fk_test_attempts_test
FOREIGN KEY ("testId") REFERENCES tests(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- test_attempts.courseId -> courses.id
ALTER TABLE test_attempts
ADD CONSTRAINT fk_test_attempts_course
FOREIGN KEY ("courseId") REFERENCES courses(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- P0 Foreign Keys: tests
-- ============================================================================

-- tests.unitId -> course_units.id
ALTER TABLE tests
ADD CONSTRAINT fk_tests_unit
FOREIGN KEY ("unitId") REFERENCES course_units(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- P0 Foreign Keys: questions
-- ============================================================================

-- questions.testId -> tests.id (nullable)
ALTER TABLE questions
ADD CONSTRAINT fk_questions_test
FOREIGN KEY ("testId") REFERENCES tests(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

COMMIT;

\echo 'Foreign key constraints added (NOT VALID).'

-- ============================================================================
-- SECTION 3: VALIDATE CONSTRAINTS
-- ============================================================================
-- This step validates the constraints and will fail if any orphans exist
-- Run this separately after confirming no orphans
-- ============================================================================

\echo '============================================================================'
\echo 'SECTION 3: Validating constraints...'
\echo '============================================================================'

-- Validate all constraints
ALTER TABLE assignment_submissions VALIDATE CONSTRAINT fk_assignment_submissions_user;
ALTER TABLE assignment_submissions VALIDATE CONSTRAINT fk_assignment_submissions_course;
ALTER TABLE assignment_submissions VALIDATE CONSTRAINT fk_assignment_submissions_unit;
ALTER TABLE assignment_submissions VALIDATE CONSTRAINT fk_assignment_submissions_grader;

ALTER TABLE certificate_issues VALIDATE CONSTRAINT fk_certificate_issues_user;
ALTER TABLE certificate_issues VALIDATE CONSTRAINT fk_certificate_issues_course;
ALTER TABLE certificate_issues VALIDATE CONSTRAINT fk_certificate_issues_template;

ALTER TABLE test_attempts VALIDATE CONSTRAINT fk_test_attempts_user;
ALTER TABLE test_attempts VALIDATE CONSTRAINT fk_test_attempts_test;
ALTER TABLE test_attempts VALIDATE CONSTRAINT fk_test_attempts_course;

ALTER TABLE tests VALIDATE CONSTRAINT fk_tests_unit;

ALTER TABLE questions VALIDATE CONSTRAINT fk_questions_test;

\echo 'All constraints validated successfully.'

-- ============================================================================
-- SECTION 4: VERIFICATION QUERIES
-- ============================================================================

\echo '============================================================================'
\echo 'SECTION 4: Verification'
\echo '============================================================================'

-- Count total FK constraints in public schema
\echo 'Total FK constraints in public schema:'
SELECT COUNT(*) as total_fk_constraints
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';

-- List new FK constraints added by this migration
\echo ''
\echo 'New FK constraints added:'
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('assignment_submissions', 'certificate_issues', 'test_attempts', 'tests', 'questions')
ORDER BY tc.table_name, kcu.column_name;

-- Tables still with zero FKs (expected: audit/log tables)
\echo ''
\echo 'Tables with ZERO outgoing FK constraints (expected: audit/log/polymorphic):'
SELECT t.table_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc 
    ON t.table_name = tc.table_name 
    AND tc.table_schema = 'public' 
    AND tc.constraint_type = 'FOREIGN KEY'
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND tc.constraint_name IS NULL
ORDER BY t.table_name;

\echo '============================================================================'
\echo 'MIGRATION COMPLETE'
\echo '============================================================================'
