## Scope
- Fix remaining UI/E2E issues without changing working APIs: admin CTAs, notifications recipient selection, admin assignments search.
- Reduce friction running tests when dev server is already up.
- Verify and stabilize permissions hook import used in admin layout.

## Changes (Config & Tests)
- Playwright config: set webServer.reuseExistingServer to true to allow tests while Next dev is running. See [playwright.config.ts](file:///e:/lms/playwright.config.ts#L61-L67).
- Update failing specs to use stable selectors:
  - Admin CTA: prefer data-testid-based selectors for “create group/course/learning path/user”. Add fallbacks to button variants.
  - Notifications: target the Recipient input reliably (MUI Select/Autocomplete). Use a data-testid on the select root and select the first option.
  - Admin Assignment search: avoid strict-mode violation by scoping to the assignments search input (use data-testid or unique placeholder).
- Add minimal targeted spec for admin assignment creation (already validated) and keep it for regression.

## Changes (UI)
- Add data-testid attributes to key admin CTAs and inputs for test reliability:
  - data-testid="admin-cta-create-group" on the create group link/button in /admin/groups
  - data-testid="admin-cta-create-course" on course create in /admin/courses
  - data-testid="admin-cta-create-learning-path" in /admin/learning-paths
  - data-testid="admin-cta-create-user" in /admin/users
  - data-testid="recipient-select" on notifications Recipient select
  - data-testid="assignments-search" on /admin/assignments search input
- Ensure unique placeholders or labels where data-testid is not viable to avoid multiple matches.

## Permissions Hook Check
- Confirm admin layout import path resolves: [layout.tsx](file:///e:/lms/apps/web/src/app/admin/layout.tsx#L38). If '@/hooks/usePermissions' isn’t a barrel re-export, update import to shared hook path: '@/shared/hooks/usePermissions'. Keep clearPermissionsCache usage on role change/logout.

## Verification
- Run fast E2E suite; confirm zero failures in admin CTA, notifications, and assignments.
- Run targeted temp spec for admin assignment creation and remove temp file after passing.
- Quick manual checks: navigate to admin pages and click CTAs; open notifications form and choose Recipient; search assignments.

## Deliverables
- Config patch to playwright.config.ts.
- Test patches to failing specs with stable selectors.
- UI patches adding data-testid attributes to critical elements.
- Short report of before/after test results and any residual issues.

## Notes
- APIs already return JSON with 2xx for the requested flows; changes focus on UI and test reliability, not on business logic or API contracts.