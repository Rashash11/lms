-- ============================================================================
-- P0 FOREIGN KEY CONSTRAINTS - APPLY (Updated)
-- ============================================================================
-- Purpose: Add database-level FK constraints for P0 critical tables
-- IMPORTANT: Run p0_fk_precheck.sql FIRST and ensure all counts are 0
-- 
-- NOTE: Skipping enrollments and assignments (already have FKs from Prisma)
-- 
-- This script:
-- 1. Creates supporting indexes (CONCURRENTLY - outside transaction)
-- 2. Adds FK constraints (NOT VALID - minimal lock)
-- 3. Validates constraints (ensures data integrity)
-- ============================================================================

\echo '============================================================================'
\echo 'P0 FK CONSTRAINTS - APPLY'
\echo '============================================================================'

-- Set safe timeouts
SET lock_timeout = '5s';
SET statement_timeout = '5min';

-- ============================================================================
-- SECTION 1: CREATE INDEXES CONCURRENTLY
-- ============================================================================
-- These run OUTSIDE of a transaction to avoid locks
-- ============================================================================

\echo ''
\echo 'Creating indexes CONCURRENTLY...'

-- password_reset_tokens indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_tokens_userId 
ON password_reset_tokens("userId");

-- assignment_submissions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_userId 
ON assignment_submissions("userId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_assignmentUnitId 
ON assignment_submissions("assignmentUnitId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignment_submissions_gradedBy 
ON assignment_submissions("gradedBy");

-- certificate_issues indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_issues_userId 
ON certificate_issues("userId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_issues_courseId 
ON certificate_issues("courseId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificate_issues_templateId 
ON certificate_issues("templateId");

-- test_attempts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_attempts_userId 
ON test_attempts("userId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_attempts_testId 
ON test_attempts("testId");

-- tests indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tests_unitId 
ON tests("unitId");

-- questions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_testId 
ON questions("testId");

-- auth_audit_log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_audit_log_user_id 
ON auth_audit_log(user_id);

\echo 'Indexes created.'

-- ============================================================================
-- SECTION 2: ADD FOREIGN KEY CONSTRAINTS (NOT VALID)
-- ============================================================================

\echo ''
\echo 'Adding FK constraints (NOT VALID)...'

BEGIN;

-- ============================================================================
-- password_reset_tokens
-- ============================================================================

ALTER TABLE password_reset_tokens
ADD CONSTRAINT fk_p0_password_reset_tokens_user
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- assignment_submissions
-- ============================================================================

ALTER TABLE assignment_submissions
ADD CONSTRAINT fk_p0_assignment_submissions_user
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE assignment_submissions
ADD CONSTRAINT fk_p0_assignment_submissions_unit
FOREIGN KEY ("assignmentUnitId") REFERENCES course_units(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE assignment_submissions
ADD CONSTRAINT fk_p0_assignment_submissions_grader
FOREIGN KEY ("gradedBy") REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- certificate_issues
-- ============================================================================

ALTER TABLE certificate_issues
ADD CONSTRAINT fk_p0_certificate_issues_user
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE certificate_issues
ADD CONSTRAINT fk_p0_certificate_issues_course
FOREIGN KEY ("courseId") REFERENCES courses(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE certificate_issues
ADD CONSTRAINT fk_p0_certificate_issues_template
FOREIGN KEY ("templateId") REFERENCES certificate_templates(id)
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- test_attempts
-- ============================================================================

ALTER TABLE test_attempts
ADD CONSTRAINT fk_p0_test_attempts_user
FOREIGN KEY ("userId") REFERENCES users(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE test_attempts
ADD CONSTRAINT fk_p0_test_attempts_test
FOREIGN KEY ("testId") REFERENCES tests(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- tests
-- ============================================================================

ALTER TABLE tests
ADD CONSTRAINT fk_p0_tests_unit
FOREIGN KEY ("unitId") REFERENCES course_units(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- questions
-- ============================================================================

ALTER TABLE questions
ADD CONSTRAINT fk_p0_questions_test
FOREIGN KEY ("testId") REFERENCES tests(id)
ON DELETE CASCADE
ON UPDATE CASCADE
NOT VALID;

-- ============================================================================
-- auth_audit_log (special: SET NULL to preserve audit trail)
-- ============================================================================

ALTER TABLE auth_audit_log
ADD CONSTRAINT fk_p0_auth_audit_log_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

COMMIT;

\echo 'FK constraints added (NOT VALID).'

-- ============================================================================
-- SECTION 3: VALIDATE CONSTRAINTS
-- ============================================================================

\echo ''
\echo 'Validating constraints...'

-- Validate all constraints
ALTER TABLE password_reset_tokens VALIDATE CONSTRAINT fk_p0_password_reset_tokens_user;

ALTER TABLE assignment_submissions VALIDATE CONSTRAINT fk_p0_assignment_submissions_user;
ALTER TABLE assignment_submissions VALIDATE CONSTRAINT fk_p0_assignment_submissions_unit;
ALTER TABLE assignment_submissions VALIDATE CONSTRAINT fk_p0_assignment_submissions_grader;

ALTER TABLE certificate_issues VALIDATE CONSTRAINT fk_p0_certificate_issues_user;
ALTER TABLE certificate_issues VALIDATE CONSTRAINT fk_p0_certificate_issues_course;
ALTER TABLE certificate_issues VALIDATE CONSTRAINT fk_p0_certificate_issues_template;

ALTER TABLE test_attempts VALIDATE CONSTRAINT fk_p0_test_attempts_user;
ALTER TABLE test_attempts VALIDATE CONSTRAINT fk_p0_test_attempts_test;

ALTER TABLE tests VALIDATE CONSTRAINT fk_p0_tests_unit;

ALTER TABLE questions VALIDATE CONSTRAINT fk_p0_questions_test;

ALTER TABLE auth_audit_log VALIDATE CONSTRAINT fk_p0_auth_audit_log_user;

\echo 'All constraints validated.'

-- ============================================================================
-- SECTION 4: VERIFICATION
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'VERIFICATION'
\echo '============================================================================'

\echo ''
\echo 'Total FK constraints in public schema:'
SELECT COUNT(*) as total_fk_constraints
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';

\echo ''
\echo 'P0 FK constraints added by this script:'
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
    AND tc.constraint_name LIKE 'fk_p0_%'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '============================================================================'
\echo 'P0 FK CONSTRAINTS APPLIED SUCCESSFULLY'
\echo '============================================================================'
