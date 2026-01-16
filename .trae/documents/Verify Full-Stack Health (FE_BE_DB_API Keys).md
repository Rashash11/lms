## What the new error means

* `net::ERR_ABORTED http://localhost:3000/admin/learning-paths` is the same class of issue: a Next.js App Router navigation/prefetch fetch is being canceled.

* These are almost always *navigation-cancel noise* in development (especially with redirects, auth checks, fast clicking, or route prefetching).

## Goal

* Eliminate the spammy console errors for **all internal** **`?_rsc`** **aborted requests** (login, admin pages, learning paths, etc.) without breaking navigation.

## Plan

1. **Disable aggressive prefetching on all sidebar/navigation Links**

   * Find every place where we use `next/link` for navigation (admin/instructor/learner/super-instructor layouts, any shared sidebar).

   * Set `prefetch={false}` everywhere.

   * For the most common sidebars, use plain anchors (`component="a" href="..."`) for internal navigation if needed.

2. **Add a dev-only console filter for RSC abort noise**

   * Add a small client-only component mounted in the root layout that wraps `console.error` and ignores messages matching:

     * `net::ERR_ABORTED` **and**

     * URL contains `?_rsc=` (Flight requests)

   * This targets only the known noisy class and keeps real runtime errors visible.

3. **Reduce redirect overlap that amplifies aborts**

   * Ensure we don’t do both: (a) middleware/server redirect and (b) client redirect at the same time for the same event.

   * Keep auth redirect logic single-sourced where possible.

4. **Verify**

   * Reproduce by clicking through `/admin/learning-paths`, `/admin/*`, `/login`.

   * Run `npm run fe:scan:smoke` to ensure scan remains green.

## Expected outcome

* The console stops flooding with `net::ERR_ABORTED ... ?_rsc=...` across the site.

* Navigation continues to work normally, and real errors still fail scans.

