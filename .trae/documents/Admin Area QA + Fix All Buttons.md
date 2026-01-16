## What I found so far
- Some admin pages are fully wired (Users, Groups create, Reports export), but a few are clearly “UI-only” or inconsistent.
- Automations admin page is hardcoded demo data: “Create Automation” and the enable switches don’t do anything, even though a real backend exists at /api/automations with create/list/enable/delete.
- Notifications drawer loads dropdown options from /api/courses,/api/groups,/api/branches but expects response fields like `courses/groups/branches`; those APIs return `{ data: [...] }`, so the dropdowns can be empty and the UI feels broken.
- Admin sidebar permission filtering currently still shows permissioned items while permissions are loading, and permissions are cached in localStorage but never cleared on logout/role-switch.

## Scope I will cover ("everything admin")
- Every route under /admin and its primary CTAs: create/edit/delete, toggles, exports, drawers/modals, and navigation items.
- Admin layout actions: sidebar links, reports flyout, role switch, logout, and any “dead” menu items.

## Plan of attack
## 1) Create a repeatable “admin check” harness
- Add/extend Playwright admin UI smoke tests to visit every /admin route and click primary buttons (open dialogs/drawers, submit minimal valid forms, verify no 404/500/error boundaries).
- Add targeted e2e tests for CRUD flows that should work end-to-end (users/groups/courses/learning paths/branches/notifications/automations).

## 2) Fix cross-cutting breakpoints first
- Standardize all admin mutations to use the existing `apiFetch()` wrapper (guarantees `x-csrf-token` on POST/PUT/PATCH/DELETE).
- Ensure permissions/UI state updates are correct on role switch + logout (clear/refresh cached permissions and avoid “flash” of unauthorized items while loading).
- Normalize client parsing for API list responses (support `{ data }` consistently, and fix places expecting non-existent keys).

## 3) Wire up currently broken admin pages/buttons
- Automations: replace hardcoded list with real API-backed list; implement “Create Automation” (dialog + POST), enable/disable toggle (PATCH), and basic delete.
- Notifications: fix option loading (courses/groups/branches) to match actual API response shape; ensure save/duplicate/toggle/delete/preview all show user-facing errors instead of silent failure.
- Sweep remaining admin pages for dead buttons (e.g., placeholders with no onClick) and either wire them to existing APIs or disable them with proper “Coming soon” UX (so nothing looks broken).

## 4) Verify
- Run the full admin smoke + relevant e2e suites and fix any remaining failing flows until green.
- Manually sanity-check the admin navigation + key CRUD pages in a local preview.

## Output you’ll get
- Admin pages where every visible button either works (calls a real endpoint) or is intentionally disabled with clear messaging.
- Automated coverage so regressions are caught immediately.
- Consistent CSRF + API response handling across all admin pages.