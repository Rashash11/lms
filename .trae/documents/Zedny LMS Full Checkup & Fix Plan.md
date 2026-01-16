# Full Project Checkup & Fix Plan

I have analyzed the codebase and identified the necessary steps to perform a comprehensive checkup, implement missing tests, and fix issues. The project has a solid foundation with `prisma` extensions for multi-tenancy and a `withGuard` wrapper for API security, but test coverage and script automation need work.

## 1. Scripts & Automation (Section 3)
I will create/update the following scripts in `package.json` and `scripts/`:

*   **`npm run checkup:full`**: Runs security, API, E2E, and performance checks.
*   **`npm run checkup:fast`**: Runs smoke tests, unit tests, and fast integration tests.
*   **`npm run checkup:api`**: Runs integration tests (`vitest run tests/integration`).
*   **`npm run checkup:rbac`**: Runs RBAC smoke tests and a new RBAC matrix check.
*   **`npm run checkup:tenant`**: Runs tenant isolation integration tests.
*   **`npm run checkup:exports`**: Runs export job integration tests.
*   **`npm run checkup:e2e`**: Runs Playwright E2E tests.

## 2. Test Implementation (Section 4)
I will implement the following test infrastructure:

### A. Shared Auth Helper
*   **File**: `tests/helpers/auth-setup.ts`
*   **Functionality**: Robust login helper that caches sessions, handles CSRF (if needed), and provides authenticated `fetch` wrappers for different roles (Admin, Instructor, Learner).

### B. RBAC Matrix Runner
*   **File**: `scripts/check-rbac-matrix.ts`
*   **Functionality**: Iterates over defined API endpoints, attempts access with different roles, and asserts expected HTTP status codes (200, 403, 401).

### C. Tenant Isolation Tests
*   **File**: `tests/integration/security/tenant-isolation.test.ts`
*   **Functionality**:
    *   Create two tenants (A & B).
    *   Verify User A cannot read/write User B's data (Courses, Users).
    *   Verify `findUnique` leaks are blocked (returns 404, not 403).

### D. Export Job Tests
*   **File**: `tests/integration/jobs/exports.test.ts`
*   **Functionality**:
    *   Mock BullMQ or use a test Redis instance.
    *   Trigger an export job (e.g., `POST /api/reports/export`).
    *   Verify job is queued, processed, and file is "generated" (mocked S3/File upload).

### E. E2E Tests (Playwright)
*   **File**: `tests/e2e/core-journeys.spec.ts`
*   **Scenarios**:
    *   **Login**: Verify login for all roles.
    *   **Course Flow**: Create Course (Instructor) -> Enroll (Learner) -> Progress -> Complete.
    *   **Admin**: Verify access to reports/settings.

## 3. Code Fixes & Improvements
*   **Zod Validation**: Scan API routes (starting with `api/courses`, `api/users`) and ensure `validateRequestBody` is used.
*   **Permission Guards**: Audit `api/` routes to ensure `withGuard` is present with correct permissions (especially for POST/PUT/DELETE).
*   **Prisma Middleware**: Verify `src/lib/prisma.ts` handles all models and edge cases (already looks good, but I'll double-check `deleteMany` and `updateMany`).

## 4. Execution Strategy (Section 5 & 6)
1.  **Step 1**: Implement the scripts and test infrastructure.
2.  **Step 2**: Run `npm run checkup:fast` to get a baseline.
3.  **Step 3**: Run `npm run checkup:tenant` and `npm run checkup:rbac`.
4.  **Step 4**: Fix any failures found (Validation, Permission gaps, Logic errors).
5.  **Step 5**: Run `npm run checkup:full` for final verification.
6.  **Step 6**: Generate the "Final Green Report".

I will start by creating the test helpers and scripts, then move to execution.
