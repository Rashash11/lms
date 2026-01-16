I will fix the `403 Forbidden` errors in the Learning Paths module by adding the missing `x-csrf-token` header to all mutation requests (POST, PATCH, DELETE).

## Root Cause
Similar to the Course module, the Learning Paths module's frontend is making mutation requests without the required `x-csrf-token` header. The backend enforces CSRF protection, causing these requests to fail with a 403 status.

## Implementation Plan

### 1. Fix Learning Paths List Page
File: `src/app/admin/learning-paths/page.tsx`
-   Add `getCsrfToken` helper.
-   Update `confirmDelete` (DELETE) to include the header.
-   Update the "Add learning path" button's `onClick` handler (POST) to include the header.

### 2. Fix Learning Path Editor Page
File: `src/app/admin/learning-paths/[id]/edit/page.tsx`
-   Add `getCsrfToken` helper.
-   Update the following functions to include the header:
    -   `saveField` (PATCH) - for auto-saving name, description, status.
    -   `handleCourseAdded` (POST) - for creating default section.
    -   `handleRemoveCourse` (DELETE).
    -   `handleAddSection` (POST).
    -   `handleUpdateSectionName` (PATCH).
    -   `handleDeleteSection` (DELETE).

### 3. Fix Add Course Modal
File: `src/app/admin/learning-paths/[id]/edit/components/AddCourseModal.tsx`
-   Add `getCsrfToken` helper (or pass it down, but helper is easier).
-   Update `handleAdd` (POST) to include the header.

### 4. Fix Learning Path Options Panel
File: `src/app/admin/learning-paths/[id]/edit/components/LearningPathOptionsPanel.tsx`
-   Add `getCsrfToken` helper.
-   Update `handleSave` (PATCH) to include the header.

### 5. Fix Users Panel
File: `src/app/admin/learning-paths/[id]/edit/components/UsersPanel.tsx`
-   Add `getCsrfToken` helper.
-   Update `handleEnrollUsers` (POST) to include the header.
-   Update `handleRemoveEnrollment` (DELETE) to include the header.

## Verification
-   I will verify by running a simulation script (similar to the previous task) to confirm that creating a learning path now returns 201 instead of 403.
-   (User Verification) You should be able to create, edit, add courses to, and delete learning paths without errors.