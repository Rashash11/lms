## Scope
- Run existing automated suites that cover frontend navigation, role-based access control, API contracts, DB/tenant isolation, and key admin/instructor/learner flows.
- Use Node.js API routes by default (leave `PYTHON_BACKEND_URL` unset in [next.config.js](file:///E:/lms/apps/web/next.config.js)).

## Preconditions
- Ensure Postgres is reachable via `DATABASE_URL`.
- Ensure Redis is reachable if job/queue tests require it (BullMQ is used).
- Use a clean, seeded test DB state (not your dev data).

## Database + Seed Setup
- Run the repo’s reset/seed pipeline:
  - `npm run test:setup` (resets test DB + seeds)
  - `npm run rbac:seed` (ensures RBAC tables are consistent)

## Backend/API Verification
- Run API + security smoke suites:
  - `npm run smoke`
  - `npm run test:security`
  - `npm run test:integration` (includes tenant isolation / csrf / API invariants)
  - `npm run test:unit`
- Run route sanity checks:
  - `npm run routes:audit`
  - `npm run routes:test`
- Run optional backend diagnostics:
  - `npm run api:diagnose`

## Frontend E2E: All Roles + Route Crawl
- Generate Playwright authenticated storage states for each role:
  - `npm run test:auth-states`
- Run role-based scan suites (broad coverage of pages/subpages):
  - `npm run fe:scan:smoke`
- Run the main end-to-end flow suite:
  - `npm run fe:test`
- Run the deep crawler (click-through / route crawl) for maximum coverage:
  - `npm run fe:test:crawl`
  - Optionally `npm run test:e2e:full` (largest/slowest)

## Triage + Fix Loop
- Collect failures by category:
  - 4xx/5xx API responses
  - Console errors (including auth/tenant issues)
  - Redirect loops / RSC aborts that cause user-visible failures
  - DB/tenant leakage assertions
- Fix issues, then re-run the smallest targeted suite first (spec file or smoke), then re-run `checkup:full`.

## One-Command “Final” Gate
- After everything is green individually, run:
  - `npm run checkup:full`

## Deliverables
- A summarized test report: failing specs/routes (if any), screenshots/videos from Playwright, and the exact failing endpoints/roles.
- If anything fails, I’ll include minimal code patches plus the smallest repro test that proves the fix.

Confirm this plan and I’ll execute it end-to-end (including running the Playwright crawlers and the full backend/integration suites).