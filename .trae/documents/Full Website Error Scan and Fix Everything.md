## What I’m Seeing So Far
- There are real “module not found” issues caused by moved files / alias mismatches.
- Biggest confirmed breakages:
  - Many pages import `@/lib/client-csrf`, but that module does not exist under your `@/lib/*` mapping.
  - Vitest/Vite alias config doesn’t match `tsconfig` path mappings, so tests can’t resolve `@/lib/*` correctly.
  - Several `tools/scripts/**` files import from a non-existent root `src/lib/*` path.

## Fix Strategy (Minimal, No Replacements)
- Fix imports/aliases so they resolve to the correct existing modules (no feature rewrites).
- Keep runtime behavior the same; only repair broken wiring.
- Ensure secrets are not committed (env files stay ignored).

## Implementation Steps
1. **Build + Type Safety Sweep**
   - Run: lint, typecheck, and `next build` to surface all compile-time errors.
   - Fix all “module not found”, invalid path aliases, and TS errors until build is clean.

2. **Repair Broken Alias + Import Paths**
   - Replace all `@/lib/client-csrf` imports with the correct module (likely `@shared/http/client-csrf`).
   - Align `apps/web/vitest.config.ts` aliases with `apps/web/tsconfig.json` paths so unit/integration tests resolve the same way as Next.

3. **Repair Tooling Scripts**
   - Update `tools/scripts/**` imports that reference `../../../src/lib/*` to the real locations in `apps/web/src/server/*` (or switch those scripts to use the same tsconfig alias resolution).

4. **Full Website Route Scan (Automated)**
   - Run the existing Playwright scan suites (smoke + route crawl) to hit lots of pages and catch runtime 500s.
   - Fix any server/API crashes found by the scan (imports, missing handlers, auth redirects, etc.).

5. **Final Verification**
   - Re-run: `next build` + the relevant smoke/e2e suites until green.
   - Manually sanity-check key flows: login → admin dashboard, instructor, learner, notifications.

## Deliverables
- Clean `next build`.
- Clean lint/typecheck.
- Scan tests passing (or reduced to known non-blocking flakes with a clear list).
- No remaining “module not found” / 500-on-navigation issues across common routes.
