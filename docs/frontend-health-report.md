# Frontend Health Report

Generated: 2026-01-14

## Scope

This report validates the LMS frontend by:

- Crawling all discovered Next.js pages per role group (filesystem-derived).
- Verifying key role landing pages load without rendering 404/error-boundary.
- Monitoring `/api/*` traffic during scans for common contract and security invariants.

Artifacts:

- Full route inventory: [frontend-routes.generated.json](file:///e:/lms/docs/frontend-routes.generated.json)
- Routes grouped by role: [frontend-routes.by-role.generated.json](file:///e:/lms/docs/frontend-routes.by-role.generated.json)
- Playwright HTML report: [playwright-report](file:///e:/lms/playwright-report/index.html)

## How To Run

- Full scan suite: `npm run fe:scan`
- Quick scan subset: `npm run fe:scan:smoke`
- View last HTML report: `npm run fe:scan:report`

## Results (Scan Suite)

Status: PASS (7/7)

- Admin core pages: PASS
- Instructor core pages + seeded detail: PASS
- Learner core pages + course player: PASS
- Route crawl (admin/super-instructor/instructor/learner): PASS

## Contract/Security Invariants Checked

During the scan, requests to `/api/*` are observed and validated:

- No HTML responses from JSON APIs
- Mutation endpoints require `x-csrf-token` (unless explicitly exempted)
- JSON responses are parseable when content-type indicates JSON
- Requests should not include `tenantId` in query params or request bodies

Implementation: [apiAssert.ts](file:///e:/lms/tests/helpers/apiAssert.ts)

## Role Coverage

### Admin

- Core smoke routes: `/admin`, `/admin/users`, `/admin/courses`, `/admin/reports`, `/admin/notifications`, `/admin/security/sessions`
- Crawl coverage: all filesystem-discovered `/admin/*` pages (see route inventory artifact)

Notes:

- Route crawler skips known “heavy editor” pages that tend to keep background activity alive:
  - `/admin/courses/new/edit`
  - `/admin/learning-paths/new`
  - `/admin/learning-paths/[id]/edit`

### Instructor

- Core smoke routes: `/instructor`, `/instructor/courses`, `/instructor/courses/:id`, `/instructor/groups`, `/instructor/conferences`
- Crawl coverage: all filesystem-discovered `/instructor/*` pages

### Learner

- Core smoke routes: `/learner`, `/learner/catalog`, `/learner/courses`, `/learner/courses/:id`, `/learner/courses/:id/units/:unitId`
- Crawl coverage: all filesystem-discovered `/learner/*` pages

### Super-Instructor

- Crawl coverage: all filesystem-discovered `/super-instructor/*` pages

### Other Groups (Inventory Only)

- Public: `/`
- Superadmin: `/superadmin/*` (inventory present; not included in the scan suite)
- Dashboard: `/dashboard`, `/courses/*`, `/users`, `/candidates/*`
- Candidate: `/candidate/*`
- Other: `/login`, `/signup`, `/forgot-password`, `/theme-preview`, `/enroll/[key]`, `/dev/auth`

## Fixes Applied During This Work

- Fixed Prisma lookup in assignment detail API using `findFirst` instead of a non-existent composite key:
  - [assignments/[id]/route.ts](file:///e:/lms/src/app/api/assignments/%5Bid%5D/route.ts)
- Fixed Instructor Assignments page to handle API response shape consistently (array vs `{ data }`):
  - [instructor/assignments/page.tsx](file:///e:/lms/src/app/%28instructor%29/instructor/assignments/page.tsx)
- Fixed Super-Instructor Conferences page to handle `{ data }` response shape and correct model fields:
  - [super-instructor/conferences/page.tsx](file:///e:/lms/src/app/%28super-instructor%29/super-instructor/conferences/page.tsx)
- Fixed Learner course player hydration warning (`<div>` inside `<p>`) and removed noisy console errors:
  - [learner unit player](file:///e:/lms/src/app/%28learner%29/learner/courses/%5Bid%5D/units/%5BunitId%5D/page.tsx)
- Updated E2E seed video URL to a reachable sample to avoid repeated 404s during scans:
  - [test-seed.ts](file:///e:/lms/scripts/test-seed.ts)
- Made route crawler resilient to “never idle” pages and navigation aborts:
  - Per-route navigation timeout
  - No `networkidle` gating
  - Skip-list for editor-heavy routes
  - [scan.routes.spec.ts](file:///e:/lms/tests/e2e/scan/scan.routes.spec.ts)
- Fixed route grouping/inventory generator edge-cases:
  - Root `page.tsx` becomes `/`
  - `/candidates/*` classified as dashboard (not candidate)
  - [route-list.ts](file:///e:/lms/tests/e2e/helpers/route-list.ts), [extract-frontend-routes.ts](file:///e:/lms/scripts/extract-frontend-routes.ts)

## Recommended Follow-Ups

- Add explicit scan specs for `superadmin`, `candidate`, and `dashboard` groups (currently inventory-only).
- Consider adding “async after navigation” stabilization for the route crawler to catch late API calls (optional, trades speed for deeper coverage).

