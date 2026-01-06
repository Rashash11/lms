-- ============================================================================
-- P0 FOREIGN KEY CONSTRAINTS - ORPHAN PRECHECK (Updated)
-- ============================================================================
-- Purpose: Detect orphaned records before adding FK constraints
-- Usage: Run this BEFORE p0_fk_apply.sql
-- 
-- IF ANY COUNT > 0: DO NOT PROCEED. Fix orphaned data first.
-- 
-- NOTE: Skipping enrollments and assignments (already have FKs from Prisma)
-- ============================================================================

\echo '============================================================================'
\echo 'P0 FK ORPHAN PRECHECK - Checking for orphaned records...'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- password_reset_tokens
-- ============================================================================

\echo 'Checking password_reset_tokens.userId -> users.id...'
SELECT COUNT(*) as "password_reset_tokens.userId_orphans"
FROM password_reset_tokens prt
LEFT JOIN users u ON prt."userId" = u.id
WHERE u.id IS NULL;

-- ============================================================================
-- assignment_submissions
-- ============================================================================

\echo 'Checking assignment_submissions.userId -> users.id...'
SELECT COUNT(*) as "assignment_submissions.userId_orphans"
FROM assignment_submissions asub
LEFT JOIN users u ON asub."userId" = u.id
WHERE u.id IS NULL;

\echo 'Checking assignment_submissions.assignmentUnitId -> course_units.id...'
SELECT COUNT(*) as "assignment_submissions.assignmentUnitId_orphans"
FROM assignment_submissions asub
LEFT JOIN course_units cu ON asub."assignmentUnitId" = cu.id
WHERE cu.id IS NULL;

\echo 'Checking assignment_submissions.gradedBy -> users.id (nullable)...'
SELECT COUNT(*) as "assignment_submissions.gradedBy_orphans"
FROM assignment_submissions asub
LEFT JOIN users u ON asub."gradedBy" = u.id
WHERE asub."gradedBy" IS NOT NULL AND u.id IS NULL;

-- ============================================================================
-- certificate_issues
-- ============================================================================

\echo 'Checking certificate_issues.userId -> users.id...'
SELECT COUNT(*) as "certificate_issues.userId_orphans"
FROM certificate_issues ci
LEFT JOIN users u ON ci."userId" = u.id
WHERE u.id IS NULL;

\echo 'Checking certificate_issues.courseId -> courses.id (nullable)...'
SELECT COUNT(*) as "certificate_issues.courseId_orphans"
FROM certificate_issues ci
LEFT JOIN courses c ON ci."courseId" = c.id
WHERE ci."courseId" IS NOT NULL AND c.id IS NULL;

\echo 'Checking certificate_issues.templateId -> certificate_templates.id...'
SELECT COUNT(*) as "certificate_issues.templateId_orphans"
FROM certificate_issues ci
LEFT JOIN certificate_templates ct ON ci."templateId" = ct.id
WHERE ct.id IS NULL;

-- ============================================================================
-- test_attempts
-- ============================================================================

\echo 'Checking test_attempts.userId -> users.id...'
SELECT COUNT(*) as "test_attempts.userId_orphans"
FROM test_attempts ta
LEFT JOIN users u ON ta."userId" = u.id
WHERE u.id IS NULL;

\echo 'Checking test_attempts.testId -> tests.id...'
SELECT COUNT(*) as "test_attempts.testId_orphans"
FROM test_attempts ta
LEFT JOIN tests t ON ta."testId" = t.id
WHERE t.id IS NULL;

-- ============================================================================
-- tests
-- ============================================================================

\echo 'Checking tests.unitId -> course_units.id...'
SELECT COUNT(*) as "tests.unitId_orphans"
FROM tests t
LEFT JOIN course_units cu ON t."unitId" = cu.id
WHERE cu.id IS NULL;

-- ============================================================================
-- questions
-- ============================================================================

\echo 'Checking questions.testId -> tests.id (nullable)...'
SELECT COUNT(*) as "questions.testId_orphans"
FROM questions q
LEFT JOIN tests t ON q."testId" = t.id
WHERE q."testId" IS NOT NULL AND t.id IS NULL;

-- ============================================================================
-- auth_audit_log (special: uses user_id not userId)
-- ============================================================================

\echo 'Checking auth_audit_log.user_id -> users.id (nullable)...'
SELECT COUNT(*) as "auth_audit_log.user_id_orphans"
FROM auth_audit_log aal
LEFT JOIN users u ON aal.user_id = u.id
WHERE aal.user_id IS NOT NULL AND u.id IS NULL;

\echo ''
\echo '============================================================================'
\echo 'PRECHECK COMPLETE'
\echo '============================================================================'
\echo 'If ALL counts are 0: SAFE to proceed with p0_fk_apply.sql'
\echo 'If ANY count > 0: ABORT. Fix orphaned records before adding FKs.'
\echo '============================================================================'
