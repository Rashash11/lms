## Overview
- Goal: Verify there are no API errors when creating a new user, course, learning path, assignment, and assigning users.
- Stack: Next.js App Router (local handlers and optional rewrites) and FastAPI backend.
- Permissions: Admin role required; UI gated via usePermissions and server-side guards. Relevant code: [layout.tsx](file:///e:/lms/apps/web/src/app/admin/layout.tsx#L181-L190), [usePermissions.ts](file:///e:/lms/apps/web/src/shared/hooks/usePermissions.ts), [api-guard.ts](file:///e:/lms/apps/web/src/server/api-guard.ts#L68-L96).

## Prechecks
- Confirm backend health endpoints respond: FastAPI [/health, /api/health] at [main.py:L78-L96](file:///e:/lms/services/api/app/main.py#L78-L96).
- Identify whether Next.js proxies to FastAPI or serves local handlers by checking rewrites: [next.config.js](file:///e:/lms/apps/web/next.config.js#L36-L44) and users rewrite example [next.config.js:L126-L134](file:///e:/lms/apps/web/next.config.js#L126-L134).
- Ensure admin session and clear client permission cache for clean state: [clearPermissionsCache](file:///e:/lms/apps/web/src/shared/hooks/usePermissions.ts#L133-L153).

## Automated Tests
- Run fast E2E suite to catch regressions in admin flows: npm run test:e2e:fast (see [README.md](file:///e:/lms/README.md#L144-L157)).
- Run full E2E suite for broader coverage including routing crawls: npm run test:e2e:full.
- Existing coverage references:
  - Admin users create flow: [admin-flows.spec.ts:L9-L67](file:///e:/lms/tests/e2e/admin-flows.spec.ts#L9-L67).
  - Courses and learning paths admin interactions: [admin-flows.spec.ts:L167-L202](file:///e:/lms/tests/e2e/admin-flows.spec.ts#L167-L202).
  - Assignments journey and RBAC smoke: [core-journeys.spec.ts:L292-L323](file:///e:/lms/tests/e2e/fast/core-journeys.spec.ts#L292-L323), [rbac-smoke-test.ts:L385-L410](file:///e:/lms/tools/scripts/smoke/rbac-smoke-test.ts#L385-L410).

## Manual UI Walkthrough
- Users: Create via admin UI [users/new/page.tsx](file:///e:/lms/apps/web/src/app/admin/users/new/page.tsx#L246-L299); confirm POST /api/users succeeds and user appears in list.
- Courses: Create using admin list action [courses/page.tsx:L110-L134](file:///e:/lms/apps/web/src/app/admin/courses/page.tsx#L110-L134); verify redirect to editor and no API errors.
- Learning Paths: Create via admin UI [learning-paths/new/page.tsx](file:///e:/lms/apps/web/src/app/admin/learning-paths/new/page.tsx#L22-L60); open add-course and enrollment drawers in edit flow.
- Assignments: Create with [AssignmentForm.tsx](file:///e:/lms/apps/web/src/modules/assignments/ui/AssignmentForm.tsx); confirm visibility and details page loads.
- Assign Users:
  - Courses: Enroll via POST /api/enrollments (payload userId, courseId) — [enrollments.py:POST](file:///e:/lms/services/api/app/routes/enrollments.py#L148-L217).
  - Learning paths: Use Next.js route [learning-paths/[id]/enrollments/route.ts](file:///e:/lms/apps/web/src/app/api/learning-paths/%5Bid%5D/enrollments/route.ts).

## Direct API Checks
- Users API: [users.py](file:///e:/lms/services/api/app/routes/users.py) and Next.js handler [api/users/route.ts](file:///e:/lms/apps/web/src/app/api/users/route.ts) — test GET, POST, PUT, DELETE/PATCH.
- Courses API: [courses.py](file:///e:/lms/services/api/app/routes/courses.py) — test GET, POST, PUT, PATCH/DELETE.
- Learning Paths API: [learning_paths.py](file:///e:/lms/services/api/app/routes/learning_paths.py) — test GET, POST, PUT, DELETE.
- Assignments API: [assignments.py](file:///e:/lms/services/api/app/routes/assignments.py) — test GET, POST, PUT, DELETE.
- Enrollments API: [enrollments.py](file:///e:/lms/services/api/app/routes/enrollments.py) — test list/create/delete.

## Error Handling & Logging
- Watch for ApiFetchError thrown by client wrapper [apiFetch.ts](file:///e:/lms/apps/web/src/shared/http/apiFetch.ts#L53-L84); verify message/details for any 4xx/5xx.
- Confirm useApiError hook behavior for 401/403/404 handling: [useApiError.ts](file:///e:/lms/apps/web/src/shared/hooks/useApiError.ts#L31-L105).
- Capture browser console logs and network HAR for each flow; ensure no red errors and all requests return 2xx with expected JSON shapes.

## Success Criteria
- Zero failing requests (status >= 400) across the five flows.
- Entities appear in subsequent list/detail views after creation.
- No console errors; UI shows success notifications where expected.
- RBAC respected: non-admin blocked, admin passes.

## Deliverables
- E2E test run reports (fast + full) and summarized pass/fail.
- Manual run checklist with entity IDs/URLs created.
- HAR/network logs for each flow and any error payloads if encountered.
- Proposed fixes (if needed) with exact file references and patches ready to apply.