## What “scan all the website for errors” means here
- Use the existing Playwright scan suite (it already crawls routes for admin/super-instructor/instructor/learner) and treats `console.error` + `pageerror` as failures.
- Add one more pass that specifically records network aborts like `net::ERR_ABORTED ... ?_rsc=...` so we can decide whether they are real bugs or benign navigation cancels.

## What we already have
- Route crawler: [scan.routes.spec.ts](file:///e:/lms/tests/e2e/scan/scan.routes.spec.ts) crawls role routes and tolerates occasional `net::ERR_ABORTED` on `page.goto`.
- Console error guard: [consoleFail.ts](file:///e:/lms/tests/helpers/consoleFail.ts) fails on `console.error` and `pageerror`.
- API contract guard: [apiAssert.ts](file:///e:/lms/tests/helpers/apiAssert.ts) checks API statuses, content-types, and missing CSRF headers.

## Why these “ERR_ABORTED” logs happen
- `?_rsc=` requests are Next.js App Router “Flight” requests.
- They get canceled when navigation/redirect happens quickly (auth redirect, permission redirect, or user clicks while something is loading). Chrome logs that cancellation as `net::ERR_ABORTED` even though it’s often not a functional bug.

## Plan to scan + fix everything
### 1) Run the full automated scan
- Run the existing `fe:scan` and `fe:scan:smoke` suites to collect:
  - Console errors
  - Page runtime errors
  - API failures and HTML responses
  - Screenshots/traces from failing routes

### 2) Classify failures into “real” vs “benign noise”
- Real (must fix):
  - `pageerror` (uncaught exceptions)
  - `console.error` from app code
  - API returning HTML, 5xx, schema mismatches
  - Auth loops (401s causing redirects)
- Benign/noise (handle cleanly):
  - `net::ERR_ABORTED` caused by navigation cancel
  - dev-only React DevTools info logs

### 3) Fix root causes across the app
- **Auth/permission redirects**: remove double-navigation patterns that cause canceled RSC requests.
  - Ensure layouts don’t trigger both a fetch + redirect while a route transition is already happening.
  - Ensure permission gating doesn’t “hide then show” items during initial load.
- **Navigation strategy** (choose the best tradeoff):
  - Keep client-side navigation (no refresh), and prevent the conditions that cause abort spam.
  - Only fall back to full page reload navigation where strictly needed.
- **External resource errors**: eliminate blocked external requests (fonts, etc.) by self-hosting or removing external imports.

### 4) Harden the scan harness so it matches your definition of “errors like this”
- Update the console/network capture to:
  - Record `requestfailed` details
  - Treat `net::ERR_ABORTED` as non-fatal *only if* it matches navigation-cancel patterns
  - Still fail for real failed resources (4xx/5xx, missing JS chunks, etc.)

### 5) Re-run scan until clean
- Re-run `fe:scan:smoke` then `fe:scan` until:
  - No console errors/page errors
  - No unexpected API contract failures
  - No recurring abort spam caused by app logic

## Deliverables
- A clean scan run (green) + summary of what was fixed.
- Updated scan helpers so future regressions are caught early.
- Optional: a “strict mode” toggle that fails on any network abort if you want zero noise at all.