I have completed the initial exploration and route discovery. I found **116 API routes** and analyzed the existing patterns (`withGuard`, standard auth flow).

Here is the plan to execute the **API ROUTING CHECKUP**:

### Phase 1: Tooling & Audit (Immediate)
1.  **Create `scripts/audit-routes.ts`**:
    -   **Function**: Scans all 116 routes.
    -   **Checks**:
        -   **Exports**: Verifies `GET`, `POST`, `PUT`, `PATCH`, `DELETE` are valid.
        -   **Dynamic Config**: Flags routes using `cookies()`/`headers()`/`request.url` without `export const dynamic = 'force-dynamic'`.
        -   **Validation**: Detects if `Zod` or `validateBody`/`validateQuery` is missing.
        -   **Guards**: Flags protected routes missing `withGuard`.
        -   **Response Format**: Scans for raw `NextResponse` usage vs standardized `apiResponse`.
    -   **Output**: A JSON/Table report of all violations.

2.  **Create `npm run routes:audit`**:
    -   Connects the script to the build process.

### Phase 2: Test Suite (Mandatory)
1.  **Create `tests/integration/routing/route-catalog.test.ts`**:
    -   **Static Analysis Test**: Fails if `audit-routes.ts` reports critical errors (missing guards on protected routes, duplicate paths).
    -   **Response Content-Type Test**: Crawls all GET endpoints (with a special "dry-run" or "schema-only" mode if possible, or just checks code structure) to ensure `application/json` is the declared content type.

2.  **Create `tests/integration/routing/auth-guard.test.ts`**:
    -   **Security Check**: Attempts to access a sampling of high-risk routes (`/api/users`, `/api/courses`, `/api/settings`) *without* a session token and asserts `401 Unauthorized` (JSON, not HTML).

3.  **Create `tests/integration/routing/no-html.test.ts`**:
    -   **Contract Check**: Verifies that even 404s and 500s on `/api/*` paths return JSON envelopes, not Next.js default HTML error pages.

### Phase 3: Execution & Fixes (Iterative)
1.  **Run Audit**: Generate the "Routing Errors List".
2.  **Apply Fixes**:
    -   **Standardize**: Refactor "manual" routes to use `withGuard` where applicable.
    -   **Config**: Add `export const dynamic = 'force-dynamic'` to all dynamic routes.
    -   **Validation**: Add missing Zod schemas.
    -   **Typos**: Fix any conflicting route segments.
3.  **Verify**: Run `npm run routes:test` until green.

### Phase 4: Final Report
-   Produce the **ROUTE AUDIT REPORT** (Deliverable A).
-   Confirm **ROUTING ERRORS LIST** is cleared (Deliverable B).

**Ready to start Phase 1?**