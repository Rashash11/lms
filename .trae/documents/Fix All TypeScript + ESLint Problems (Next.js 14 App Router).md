## Inventory (Source of Truth)
1. Run `pnpm lint`, `pnpm typecheck` (or `tsc --noEmit`), and `pnpm build` and save full stdout/stderr into versioned files under `docs/problems-inventory/`.
2. Pull VSCode “Problems” diagnostics for the whole workspace and treat that list as authoritative.
3. Normalize the toolchain:
   - If `pnpm` is unavailable, install/use it or run the equivalent `npm run lint/build` while keeping command outputs saved.
   - Add missing scripts if needed (e.g. `typecheck`).

## Cluster A — CSRF + Fetch Standardization (Highest Repeat)
1. Implement canonical CSRF helper at `src/shared/security/csrf.ts`:
   - `export function getCsrfToken(): string | undefined`
   - Browser-safe (`typeof document === 'undefined'` → `undefined`)
   - Read from the existing CSRF source used by API Guard: `csrf-token` cookie.
2. Implement canonical fetch wrapper at `src/shared/http/apiFetch.ts`:
   - `export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T>`
   - Auto JSON headers, JSON stringify for object bodies, and only attach `x-csrf-token` in the browser when available.
   - On non-2xx, throw a typed error `{ message, status, details? }` derived from server JSON when possible.
3. Refactor call sites:
   - Replace direct `fetch('/api/...', { headers: { 'x-csrf-token': getCsrfToken() } })` patterns with `apiFetch<T>()`.
   - Remove duplicated CSRF helpers by re-exporting/bridging legacy imports (e.g. update `src/lib/client-csrf.ts` to re-export the canonical helper so existing imports don’t break).

## Cluster B — Broken Imports / Wrong Paths
1. Use the lint/typecheck output + Problems list to group missing-module and wrong-path issues.
2. Fix via:
   - Correcting alias usage (`@/`, `@shared/`, `@modules/`) to match `tsconfig.json`.
   - Replacing stale paths from refactors.
   - Ensuring barrel exports in `src/shared/types/index.ts` (and similar) match usage.

## Cluster C — Export Mismatches (Default vs Named)
1. For each “export mismatch” error cluster:
   - Align component exports with Next.js conventions (pages/layouts default exports; shared components named exports if consistently used).
   - Update import sites accordingly.
2. Ensure `route.ts` exports match Next.js handler naming (`GET/POST/...`).

## Cluster D — Client/Server Boundary Issues
1. Fix server components importing client-only code (hooks, `document/window`, client helpers):
   - Add `'use client'` only where necessary.
   - Split files into `Client` component wrappers when needed.
2. Ensure server code uses `cookies()`/headers APIs (where appropriate) instead of client cookie readers.

## Cluster E — Stubs / Unused / Type Hygiene
1. Implement empty handlers that are wired to UI interactions using existing API routes.
2. Remove dead code/unused vars that still trigger errors (even if ESLint rules are relaxed, TS often isn’t).
3. Replace unsafe `any` only when it’s causing real errors:
   - Prefer `unknown` + runtime narrowing, or real interface types already present in `src/shared/types`.

## Repo-Wide Typecheck Coverage
1. Because current `tsconfig.json` excludes `scripts/` and `prisma/`, add a dedicated `tsconfig.scripts.json` (or expand coverage) so “Problems” in those folders are also typechecked.
2. Add/adjust `pnpm typecheck` to run all relevant `tsc` projects so CI-like checks match VSCode Problems.

## Regression Gates (Must End Green)
1. Re-run and save outputs:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
   - `pnpm fe:scan:smoke`
2. Confirm VSCode Problems list is empty (0).

## Deliverables
- Canonical helpers: `src/shared/security/csrf.ts`, `src/shared/http/apiFetch.ts`.
- Refactors: replace manual CSRF+fetch usage across UI files.
- Repo-wide fixes for imports/exports/client-server boundaries.
- Saved command outputs + final “all green” summary.