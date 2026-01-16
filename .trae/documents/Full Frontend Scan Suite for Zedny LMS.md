## Overview
- Build a comprehensive Playwright scan that crawls all App Router pages across roles, validates backend connectivity and contract, and fails on runtime/console/network issues.
- Leverage existing helpers (routes, login, apiAssert, consoleFail, route-list) and add focused scan specs and utilities.
- Produce a Frontend Health Report summarizing coverage, status per route, backend calls, and fixes.

## Route Inventory (Grouped by Role)
- Public: /, /login, /signup, /forgot-password, /theme-preview
- Superadmin: /superadmin, /superadmin/system-health, /superadmin/tenants
- Admin: core pages under /admin (users, courses, learning-paths, groups, branches, assignments, skills, reports, notifications, automations, settings, security/*, course-store, discussions, files, gamification, subscription)
- Super-Instructor: /super-instructor (users, courses, learning-paths, assignments, groups, grading-hub, conferences, reports, calendar, skills)
- Instructor: /instructor (courses, learning-paths, assignments, grading-hub, groups, conferences, calendar, reports, skills, discussions, ilt, grading, learners, messages)
- Learner: /learner (courses, catalog, assignments, certificates, ilt, achievements, discussions, leaderboard, messages) and course/unit pages
- Candidate: /candidate (onboarding, profile, exams, history, help)
- Dashboard: /(dashboard) group (dashboard, courses, candidates, users) plus /courses, /users top-level
- Dynamic pages: use tests/e2e/fixtures/seed.json to resolve IDs (e.g., courseAId, unitVideoId, lpAId, branch/node IDs, assignment IDs)

## Test Suite Additions
- Create Playwright suite under tests/e2e/scan/
  - scan.routes.spec.ts: exhaustive route crawler per role using extractFrontendRoutesFromFs + staticRoutes + dynamic routes; asserts no 404/500/error boundaries; validates sidebar active nav where applicable.
  - scan.admin.spec.ts: admin core flows (open pages, interact with lists/modals, export buttons) and API contract checks (users, courses, reports overview, notifications).
  - scan.instructor.spec.ts: instructor flows (courses list/detail, conferences, groups, grading-hub) and API calls correctness.
  - scan.learner.spec.ts: learner catalog, course player (unit load/complete), assignments; asserts proper 403/redirect for admin routes.
  - scan.reports.spec.ts: reports page loads and training progress export returns XLSX content-type.
- Each spec:
  - Instantiate context via tests/helpers/login.ts storage states for roles.
  - Attach console/runtime fail via tests/helpers/consoleFail.ts.
  - Attach API observer via tests/helpers/apiAssert.ts with fail on unexpected 4xx/5xx, HTML content-type, missing CSRF on mutations, and Zod schema validation for key endpoints.
  - Capture artifacts (screenshots + api-log.json) on failures.

## Helper Additions/Reuse
- Reuse:
  - tests/helpers/login.ts to open contexts by role.
  - tests/helpers/consoleFail.ts to fail on console.error/pageerror (configurable console.warn).
  - tests/helpers/apiAssert.ts to assert JSON, status, content-type, CSRF, and response Zod schemas (already includes auth, me, users, catalog, reports export contracts).
  - tests/e2e/fixtures/routes.ts for static/dynamic route lists and forbidden routes per role.
  - tests/e2e/helpers/route-list.ts to auto-discover App Router pages from filesystem (covers >95%).
- Add:
  - tests/helpers/artifacts.ts: utility to save screenshots/network logs consistently and name by role+route.
  - Optional schemas extension: tests/helpers/schemas.ts with Zod contracts for additional endpoints (e.g., /api/admin/* overview, /api/instructor/* pages, /api/learner/progress, /api/courses/[id]). Wire into apiAssert.apiContracts.

## NPM Scripts
- fe:scan: run headless full scan suite (starts e2e web server via playwright.config webServer)
- fe:scan:headed: run scans in headed mode for debugging
- fe:scan:smoke: run a reduced subset (admin, instructor, learner critical paths)
- fe:scan:report: parse last run output and print a summarized Frontend Health Report (read Playwright report or artifacts)

## Execution Flow
1) Setup: ensure test database seeded and auth storage states exist (npm run test:setup + npm run test:auth-states).
2) Launch Playwright with existing webServer readiness at /api/e2e/ready.
3) For each role: crawl routes and run role-specific flows; attach API observer and console fail; collect artifacts on any failure.
4) After tests: generate “Frontend Health Report” markdown summarizing visited routes grouped by role, backend calls made and their status/content-type, any console/network errors, and top recurring issues.

## Failure Handling & Fix Policy
- For each failure:
  - Reproduction: route path, role, steps executed, API logs (request/response), console logs, screenshot.
  - Root cause categories: wrong href/route group mapping, wrong API path/method, missing auth cookies/CSRF header, non-JSON API responses, hydration mismatch, caching/config mistakes.
  - Exact code edits: provide file path with line ranges and precise changes (e.g., fix fetch to /api/instructor/conferences method/headers, correct Next.js link href in sidebar, move client-side code out of server components to resolve hydration errors, add guard/permission checks to API routes to return consistent JSON).
- Re-run scan until green.

## Reporting
- Produce artifacts:
  - api-log.json per test containing entries and top failures.
  - console-errors.json when console/page errors occur.
  - screenshots on failure.
- Aggregate into Frontend Health Report (markdown) with:
  - All routes visited by role, status (PASS/FAIL)
  - Backend calls for each page with method/path/status/content-type and schema validation result
  - Error summary with exact fixes to apply.

## Initial Coverage Estimate & Gaps
- extractFrontendRoutesFromFs ensures >95% coverage of pages; dynamic routes are filled via seed.json.
- Candidate and dashboard route groups are included via filesystem + staticRoutes.
- Forbidden route checks use fixtures.forbiddenRoutes for menu and direct navigation.

## Confirmation
- On approval, I will:
  - Add the scan specs, helpers, and npm scripts.
  - Extend apiAssert contracts for instructor, admin, learner endpoints as needed.
  - Run the full scan headless and headed, triage failures, apply fixes, and deliver the final Frontend Health Report.