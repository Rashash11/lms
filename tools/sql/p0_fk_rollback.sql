-- ============================================================================
-- P0 FOREIGN KEY CONSTRAINTS - ROLLBACK (Updated)
-- ============================================================================
-- Purpose: Remove P0 FK constraints added by p0_fk_apply.sql
-- 
-- NOTE: Skipping enrollments and assignments (those FKs are from Prisma)
-- 
-- This script:
-- 1. Drops all FK constraints added (by explicit name)
-- 2. Optionally drops indexes (commented out - indexes don't hurt performance)
-- ============================================================================

\echo '============================================================================'
\echo 'P0 FK CONSTRAINTS - ROLLBACK'
\echo '============================================================================'

BEGIN;

-- ============================================================================
-- DROP FOREIGN KEY CONSTRAINTS
-- ============================================================================

\echo ''
\echo 'Dropping P0 FK constraints...'

-- password_reset_tokens
ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS fk_p0_password_reset_tokens_user;

-- assignment_submissions
ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS fk_p0_assignment_submissions_user;
ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS fk_p0_assignment_submissions_unit;
ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS fk_p0_assignment_submissions_grader;

-- certificate_issues
ALTER TABLE certificate_issues DROP CONSTRAINT IF EXISTS fk_p0_certificate_issues_user;
ALTER TABLE certificate_issues DROP CONSTRAINT IF EXISTS fk_p0_certificate_issues_course;
ALTER TABLE certificate_issues DROP CONSTRAINT IF EXISTS fk_p0_certificate_issues_template;

-- test_attempts
ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS fk_p0_test_attempts_user;
ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS fk_p0_test_attempts_test;

-- tests
ALTER TABLE tests DROP CONSTRAINT IF EXISTS fk_p0_tests_unit;

-- questions
ALTER TABLE questions DROP CONSTRAINT IF EXISTS fk_p0_questions_test;

-- auth_audit_log
ALTER TABLE auth_audit_log DROP CONSTRAINT IF EXISTS fk_p0_auth_audit_log_user;

COMMIT;

\echo 'P0 FK constraints dropped.'

-- ============================================================================
-- DROP INDEXES (OPTIONAL - commented out)
-- ============================================================================
-- Indexes generally improve performance and don't hurt.
-- Uncomment ONLY if you want to remove them completely.
-- ============================================================================

/*
\echo ''
\echo 'Dropping indexes...'

DROP INDEX CONCURRENTLY IF EXISTS idx_password_reset_tokens_userId;
DROP INDEX CONCURRENTLY IF EXISTS idx_assignment_submissions_userId;
DROP INDEX CONCURRENTLY IF EXISTS idx_assignment_submissions_assignmentUnitId;
DROP INDEX CONCURRENTLY IF EXISTS idx_assignment_submissions_gradedBy;
DROP INDEX CONCURRENTLY IF EXISTS idx_certificate_issues_userId;
DROP INDEX CONCURRENTLY IF EXISTS idx_certificate_issues_courseId;
DROP INDEX CONCURRENTLY IF EXISTS idx_certificate_issues_templateId;
DROP INDEX CONCURRENTLY IF EXISTS idx_test_attempts_userId;
DROP INDEX CONCURRENTLY IF EXISTS idx_test_attempts_testId;
DROP INDEX CONCURRENTLY IF EXISTS idx_tests_unitId;
DROP INDEX CONCURRENTLY IF EXISTS idx_questions_testId;
DROP INDEX CONCURRENTLY IF EXISTS idx_auth_audit_log_user_id;

\echo 'Indexes dropped.'
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'VERIFICATION'
\echo '============================================================================'

\echo ''
\echo 'Remaining P0 FK constraints (should be 0):'
SELECT COUNT(*) as remaining_p0_fk_constraints
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE 'fk_p0_%';

\echo ''
\echo 'Total FK constraints in public schema:'
SELECT COUNT(*) as total_fk_constraints
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';

\echo ''
\echo '============================================================================'
\echo 'P0 FK CONSTRAINTS ROLLBACK COMPLETE'
\echo '============================================================================'
