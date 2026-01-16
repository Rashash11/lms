## Definition of “Scan Everything” (What I Will Automate)

* **Static (every TS/TSX/JS file you own)**: TypeScript compile + ESLint + dependency/import audit.

* **Build (every Next page/route)**: Next production build compiles all app routes and server code.

* **Runtime (every page per role)**: Playwright route crawl loads every discovered route and asserts no 404/500 + no error boundary.

* **API coverage**: Route audit + direct-handler API diagnostics for critical endpoints.

* **DB layer**: Prisma validate/generate and a minimal DB connectivity check.

* **Repo hygiene**: remove unreferenced artifacts and stop generating new ones.

## Work Plan

### 1) Create a Single “Scan All” Gate

* Add `npm run scan:all` that runs, in order:

  * `npm run lint`

  * `npm run typecheck`

  * `npm run build`

  * dependency/import audit over `apps/web/src`, `scripts`, `tools/scripts`

  * `npm run routes:audit`

  * `npm run test:unit` + `npm run test:integration`

  * `npm run test:security` + `npm run checkup:rbac`

  * `npm run test:setup` + `npm run test:auth-states`

  * Playwright: `npm run fe:scan` (route crawl across roles) + `npm run fe:test` (flows)

### 2) Fix “Everything Connected Right” Issues

* Ensure every referenced script/file in CI exists:

  * Add missing `seed:test` (alias to `test:setup`) OR update workflow to use existing scripts.

  * Provide `scripts/check-deps.js` and make it scan the real directories (not `src/`).

* Ensure frontend routes ↔ RBAC ↔ API permissions are consistent:

  * Keep `check-rbac-matrix` aligned with `permissions-registry`.

  * Ensure guarded API routes used by pages are accessible by intended roles.

### 3) Remove Production-Unsafe Debug/Noise

* Remove `[LOGIN DEBUG]` logging and stop returning verbose internal error messages from auth endpoints.

* Introduce a minimal internal logger wrapper (no new dependency) and gate verbose logs behind `NODE_ENV !== 'production'`.

* Optionally enforce a lint rule for `no-console` in app code except inside the logger.

### 4) Clean the Workspace (“No Errors in My Folder”)

* Delete or move unreferenced debug output artifacts (e.g. `server_debug_out.txt`, `checkup_output.txt`, `security_test_results_utf8.txt`, `rbac_test_results_utf8.txt`).

* Add/adjust `.gitignore` so Playwright/Vitest/Next artifacts don’t pollute the repo.

### 5) Verification Loop Until Perfect

* Run `npm run scan:all` repeatedly.

* For each failure, patch the root cause (code/config/workflow) and re-run the smallest relevant subset, then re-run `scan:all`.

* Finish only when `scan:all` is fully green and the repo is clean.

## Deliverables

* One command (`npm run scan:all`) that scans the whole repo surface area and stays green.

* No missing scripts/files referenced by workflows.

* No debug/PII leakage in production endpoints.

* Clean repo (no stray artifacts).

