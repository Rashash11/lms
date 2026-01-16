I have scanned the codebase and identified 45 files where `fetch` calls (specifically POST, PUT, DELETE, PATCH) are missing the CSRF token header and likely the `credentials: 'include'` option. This is a widespread issue that will cause "401 Unauthorized" or "403 Forbidden" errors across the application, just like the one you encountered.

### **Plan**

1.  **Systematic Fix**:
    *   I will go through the identified files and update every mutation `fetch` call (POST, PUT, DELETE, PATCH) to:
        *   Include the `x-csrf-token` header: `headers: { ..., 'x-csrf-token': getCsrfToken() }`.
        *   Ensure `credentials: 'include'` is set.
    *   I will also ensure `getCsrfToken` is imported from `@/lib/client-csrf` in these files.

2.  **Scope**:
    *   **Instructor Area**: Assignments, Learning Paths, Layout.
    *   **Learner Area**: Assignments, Catalog, Courses, Layout.
    *   **Super Instructor Area**: Conferences, Courses, Grading Hub, Groups, Learning Paths, Reports, Skills, Users.
    *   **Admin Area**: Courses, Groups, Reports, Security Audit, Skills.
    *   **Shared Modules**: Course Editor components (CloneLink, CourseFiles, CourseUsers, UnitModals), Report Tabs.

3.  **Verification**:
    *   After applying the fixes, I will verify a few critical paths (e.g., creating a course, assigning a user) to ensure the errors are resolved.

This is a large-scale fix, but it's necessary to ensure the application works correctly and securely. I will start immediately upon your confirmation.