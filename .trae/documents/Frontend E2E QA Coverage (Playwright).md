## Route Inventory (Step 1)
- Use the already-discovered App Router page list (below) as the initial canonical route list.
- Add an automated extractor script that scans `src/app/**/page.tsx` and normalizes Next.js segments:
  - Convert `[id]` to `:id` patterns and keep concrete seeded variants in fixtures.
  - Exclude `src/app/api/**` and non-page route handlers.
  - Group by role using the first route segment: `superadmin`, `admin`, `super-instructor`, `instructor`, `learner`, `candidate`.
- Extend existing `tests/e2e/fixtures/routes.ts` to include:
  - `superadmin`, `candidate`, and `(dashboard)` routes
  - dynamic route mappings for *all* dynamic pages

## Deterministic Seeding (Hard Requirement)
- Keep using existing deterministic DB seed pipeline:
  - `npm run test:setup` generates the database + `tests/e2e/fixtures/seed.json`
  - `npm run test:auth-states` generates role storage states under `tests/e2e/storage/*.json`
- Add a Playwright `globalSetup` that runs those two scripts when missing/stale, so CI + local are deterministic without manual steps.

## Playwright Test Suite Structure (Deliverable 2)
- Add the requested spec entrypoints (thin wrappers that call shared flows/utilities):
  - `tests/e2e/auth.spec.ts`
  - `tests/e2e/routing-crawl.spec.ts`
  - `tests/e2e/admin-flows.spec.ts`
  - `tests/e2e/instructor-flows.spec.ts`
  - `tests/e2e/learner-flows.spec.ts`
  - `tests/e2e/reports.spec.ts`
- Add requested helpers (reusing existing `tests/e2e/helpers/auth.ts` + fixtures):
  - `tests/helpers/login.ts` (context creation per role + optional node switch)
  - `tests/helpers/apiAssert.ts` (network capture + assertions + schema validation)
  - `tests/helpers/consoleFail.ts` (fail on console/page errors + hydration/routing)
  - `tests/helpers/seed.ts` (load seed.json + expose IDs + ensure seeded state)

## Network Contract Layer (Deliverable 4 + Non‑Negotiables)
- Implement a centralized `ApiContract` registry in tests:
  - Map key endpoints → expected method, expected status, expected content-type, and a Zod schema for JSON.
  - For binary downloads (e.g. training-progress export), assert correct status + content-type and *do not* attempt JSON parsing.
- Implement `attachApiObserver(context/page, contract)`:
  - Capture every request/response to `**/api/**`.
  - Assert:
    - URL, method
    - status code (no 4xx/5xx unless explicitly expected by the test)
    - content-type is JSON for JSON endpoints; never HTML
    - request body shape for mutations (parse JSON `postData`)
    - presence of CSRF header on POST/PUT/PATCH/DELETE (per project requirement)<mccoremem id="01KEW3RDPNCFZ1FNK7B5GJ62TK" />
  - Save “top 10 relevant calls” + full logs as test attachments when failures occur.

## Route Crawl (Deliverable 3)
- Replace/augment existing crawler with a deterministic, role-aware crawl:
  - Collect routes from the extractor output + `tests/e2e/fixtures/routes.ts`.
  - For each role:
    - load role storageState
    - visit each route
    - assert: no 404, no error boundary, no redirect loops
    - assert layout presence (role-specific nav container) and active nav highlight
    - exercise hover flyouts for Reports (admin + super-instructor + instructor)
  - On failure: screenshot, HTML snapshot, console log, network log.

## RBAC + Tenant/Node Isolation End-to-End
- RBAC:
  - For each role, verify navigation menu shows only allowed items.
  - Attempt forbidden routes (fixture list + generated list) → expect redirect or 403 UI.
  - Attempt forbidden UI actions → assert API returns 403 and UI handles it.
- Tenant/node scoping:
  - Use seeded tenants/nodes from `seed.json` and `/api/auth/switch-node` to switch branches.
  - Attempt cross-tenant IDs in URLs → assert 403/404 and no data leak.

## Critical Flow Tests (Step 4)
- Admin:
  - login → dashboard → users CRUD → roles assign → courses CRUD/publish → categories CRUD → reports export download.
- Instructor/Super-instructor:
  - dashboard → manage courses → create unit/section → publish → enrollments → grading hub.
- Learner:
  - catalog → enroll → course player → complete unit → resume state → certificates.
- Candidate:
  - onboarding/profile → exams list → attempt exam → submit → results.

## Scripts (Deliverable 3)
- Add npm aliases on top of existing E2E scripts:
  - `fe:test` → `test:e2e`
  - `fe:test:headed` → Playwright headed run
  - `fe:test:crawl` → routing crawl project
  - `fe:test:smoke` → fast suite

## Fixes for Common Next.js 14 Routing/API Mismatches (Step 5)
- Fix missing imports/typos that cause runtime console errors (example found: `admin/reports` uses `getCsrfToken()` but doesn’t import it).
- Fix invalid TSX imports/duplicate imports (example found: `instructor/conferences/page.tsx` has broken MUI import list and duplicate `getCsrfToken`/`Alert`).
- Fix wrong endpoint paths (example likely: conferences list uses `/api/conferences` but mutations use `/api/instructor/conferences`; tests will force consistency).
- Fix incomplete UI wiring (example found: learner catalog “Enroll Now” button has no click handler; tests will require `/api/courses/:id/enroll` and UI update).
- Fix role redirects and RBAC session usage (ensure role selection/redirect covers SUPER_ADMIN/CANDIDATE where applicable; ensure session activeRole is preserved end-to-end).<mccoremem id="03feabpks7abeygkm556ikjqn" />
