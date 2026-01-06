# Database Relations Strategy

## Overview

This document explains the hybrid foreign key (FK) constraint strategy used in the LMS database schema.

## Background

The LMS uses **Prisma ORM** with PostgreSQL. By default, Prisma uses `relationMode = "prisma"`, which means:
- ✅ Relations are defined in the Prisma schema
- ❌ Foreign key constraints are **NOT** created at the database level
- ⚠️ Referential integrity is enforced by Prisma at the application layer

### Why This Matters

**Problem:** Without database-level FKs:
- pgAdmin's ERD shows most tables as disconnected
- No database-level referential integrity
- Risk of orphaned records if accessing DB directly (outside Prisma)
- Harder to debug data inconsistencies

**Solution:** Add **selective database-level FK constraints** for P0 (critical) tables only.

---

## Hybrid Strategy

### P0 Tables: Database-Level FKs ✅

These tables have **actual database FK constraints** for data integrity:

| Table | FK Constraints | Rationale |
|-------|---------------|-----------|
| `enrollments` | `userId`, `courseId` | ✅ Already has FKs (Prisma migration) |
| `assignments` | `courseId` | ✅ Already has FK (Prisma migration) |
| `assignment_submissions` | `userId`, `courseId`, `assignmentUnitId`, `gradedBy` | **P0** - Critical for grading system |
| `certificate_issues` | `userId`, `courseId`, `templateId` | **P0** - Certificate integrity |
| `test_attempts` | `userId`, `testId`, `courseId` | **P0** - Assessment results |
| `tests` | `unitId` | **P0** - Test-to-content linkage |
| `questions` | `testId` | **P0** - Question-to-test linkage |

### Soft-Reference Tables: No Database FKs ❌

These tables intentionally have **NO** database-level FK constraints:

#### Audit & Log Tables
- `auth_audit_log` - Audit records must persist even if user deleted
- `timeline_events` - Historical event log
- `notification_history` - Sent notification log
- `automation_logs` - Automation execution log
- `import_jobs` / `import_results` - Import history
- `points_ledger` - Gamification history

#### Polymorphic References
- `attachments` - `entityId` can reference multiple table types
- `files` - `ownerId` can reference multiple table types
- `discussions` - `audienceId` can be branch/group/course
- `analytics_dashboards` - `targetId` is polymorphic

#### Analytics & Reporting
- `report_exports` - Report generation history
- `reports` - Report definitions (references via JSON)

#### System Configuration
- `api_keys` - Standalone API key storage
- `sso_configs` - SSO provider configurations
- `integrations` - External integration configs

---

## Migration Details

### Applied Migration

**File:** [`prisma/migrations/manual_add_p0_foreign_keys.sql`](file:///e:/lms/prisma/migrations/manual_add_p0_foreign_keys.sql)

**Applied:** 2026-01-05

**What It Does:**
1. **Pre-validates** data for orphaned records
2. Creates **indexes** (CONCURRENTLY) on FK columns
3. Adds **FK constraints** (NOT VALID) to minimize locks
4. **Validates** constraints separately
5. Provides **verification** queries

### Safe Application

```powershell
# Apply migration
.\scripts\apply-p0-fks.ps1

# Rollback if needed
.\scripts\rollback-p0-fks.ps1
```

### Constraints Added

```sql
-- assignment_submissions
fk_assignment_submissions_user       (userId → users.id)
fk_assignment_submissions_course     (courseId → courses.id)
fk_assignment_submissions_unit       (assignmentUnitId → course_units.id)
fk_assignment_submissions_grader     (gradedBy → users.id)

-- certificate_issues
fk_certificate_issues_user           (userId → users.id)
fk_certificate_issues_course         (courseId → courses.id)
fk_certificate_issues_template       (templateId → certificate_templates.id)

-- test_attempts
fk_test_attempts_user                (userId → users.id)
fk_test_attempts_test                (testId → tests.id)
fk_test_attempts_course              (courseId → courses.id)

-- tests
fk_tests_unit                        (unitId → course_units.id)

-- questions
fk_questions_test                    (testId → tests.id)
```

---

## Cascade Behavior

### ON DELETE CASCADE

Used when child records should be deleted with parent:

- `assignment_submissions.userId` → Delete submissions when user deleted
- `certificate_issues.userId` → Delete certificates when user deleted
- `test_attempts.userId` → Delete attempts when user deleted

### ON DELETE SET NULL

Used when relationship is optional:

- `assignment_submissions.gradedBy` → Preserve submission, clear grader reference
- `certificate_issues.courseId` → Preserve certificate, clear course link

### ON DELETE RESTRICT

Used when parent deletion should be blocked if children exist:

- `certificate_issues.templateId` → Cannot delete template if certificates issued

---

## Re-Running the Audit

To check current FK constraint status:

```sql
-- Count total FK constraints
SELECT COUNT(*) 
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';

-- List all FK constraints
SELECT 
    tc.table_name,
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
ORDER BY tc.table_name;

-- Find tables with ZERO FKs
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
```

---

## Expected State After Migration

### Before Migration
- **Total FK constraints:** ~43
- **Tables with FKs:** ~43
- **Isolated tables:** ~51 (54%)

### After Migration
- **Total FK constraints:** ~55 (+12 constraints)
- **P0 tables secured:** assignment_submissions, certificate_issues, test_attempts, tests, questions
- **ERD visibility:** ✅ P0 relationships now visible in pgAdmin
- **Isolated tables:** ~39 (expected: audit/log/polymorphic)

---

## Best Practices

### ✅ DO

- Use Prisma for all application data access
- Let Prisma migrations manage `enrollments`, `users`, `courses` FKs
- Rely on database FKs for P0 critical tables
- Keep audit/log tables FK-free for historical integrity

### ❌ DON'T

- Bypass Prisma and modify data directly (except for admin tasks)
- Add FKs to polymorphic reference columns
- Add FKs to audit/log tables
- Delete users without handling cascade effects

---

## Troubleshooting

### Issue: Migration fails with orphaned records

**Solution:** Run pre-validation queries in the migration file and remediate:

```sql
-- Example: Find orphaned assignment submissions
SELECT * FROM assignment_submissions asub
LEFT JOIN users u ON asub."userId" = u.id
WHERE u.id IS NULL;

-- Remediate: Delete orphans
DELETE FROM assignment_submissions 
WHERE "userId" NOT IN (SELECT id FROM users);
```

### Issue: FK constraint violation in application

**Cause:** Application trying to insert/update with invalid foreign key

**Solution:** Fix application code to ensure valid references before insert/update

### Issue: Cannot delete referenced entity

**Cause:** FK with `ON DELETE RESTRICT` or no cascade set

**Solution:** Either:
1. Delete child records first, OR
2. Update migration to use `ON DELETE CASCADE` or `SET NULL`

---

## References

- [Schema Audit Report](file:///C:/Users/mi741/.gemini/antigravity/brain/69f3616b-efd1-400d-acb1-de02fe62f6a5/schema_audit_report.md)
- [Prisma RelationMode Docs](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/relation-mode)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
