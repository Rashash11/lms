I will systematically fix the `403 Forbidden` (CSRF) errors across the entire application by ensuring all state-changing API requests (POST, PUT, PATCH, DELETE) include the required `x-csrf-token` header.

## Root Cause
The application's backend enforces CSRF protection for security, but many frontend pages are making requests without the necessary `x-csrf-token` header. This causes the server to reject these requests.

## Implementation Plan

### 1. Create Shared CSRF Helper
File: `src/lib/client-csrf.ts`
- Create a utility function `getCsrfToken()` that retrieves the token from the browser cookie. This avoids code duplication and makes future updates easier.

### 2. Apply Fix to Admin Module
I will update the following files to import `getCsrfToken` and include the `x-csrf-token` header in `fetch` calls:
- **Users**:
    - `src/app/admin/users/page.tsx` (Delete user)
    - `src/app/admin/users/new/page.tsx` (Create user)
    - `src/app/admin/users/[id]/edit/page.tsx` (Update user)
- **Groups**:
    - `src/app/admin/groups/new/page.tsx` (Create group)
- **Assignments**:
    - `src/app/admin/assignments/page.tsx` (Delete assignment)
- **Notifications**:
    - `src/app/admin/notifications/page.tsx` (Send notification)
- **Branches**:
    - `src/app/admin/branches/components/BranchForm.tsx` (Create/Update branch)

### 3. Apply Fix to Instructor Module
- **Courses**:
    - `src/app/(instructor)/instructor/courses/page.tsx` (Delete course)
- **Groups**:
    - `src/app/(instructor)/instructor/groups/page.tsx` (Create/Delete group)
- **Skills**:
    - `src/app/(instructor)/instructor/skills/page.tsx` (Add/Delete skill)
- **Calendar**:
    - `src/app/(instructor)/instructor/calendar/page.tsx` (Add event)
- **Conferences**:
    - `src/app/(instructor)/instructor/conferences/page.tsx` (Create conference)

### 4. Apply Fix to Authentication Module
- **Signup**: `src/app/signup/page.tsx`
- **Forgot Password**: `src/app/forgot-password/page.tsx`

## Verification
- I will verify the fix by checking that the code correctly imports and uses the `getCsrfToken` helper.
- You will be able to perform actions like creating users, deleting groups, and sending notifications without seeing "403 Forbidden" errors.