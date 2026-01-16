I will investigate why the roles are not loading by adding debug logging and inspecting the authentication flow.

### **Plan**

1.  **Inspect Authentication & DB Config**:
    *   Read `src/lib/prisma.ts` to ensure the database client is correctly exported.
    *   Read `src/lib/auth.ts` to understand how user roles are stored in the session and verified.

2.  **Add Debug Logging**:
    *   **Frontend**: Add `console.log` to `src/app/admin/users/new/page.tsx` to inspect the API response status and data.
    *   **Backend**: Add `console.log` to `src/app/api/admin/roles/route.ts` to verify the endpoint is hit, the user is authenticated, and the DB query returns data.

3.  **Analyze & Fix**:
    *   Based on the findings (or proactive hardening), I will ensure the API route correctly returns data and the frontend correctly consumes it.
    *   I will also verify if the `withGuard` middleware is correctly validating the "ADMIN" role.

4.  **Verification**:
    *   I will verify the fix by checking the code logic and asking you to test the page again.