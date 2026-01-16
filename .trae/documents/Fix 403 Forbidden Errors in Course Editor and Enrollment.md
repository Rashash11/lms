I will fix the `403 Forbidden` error by adding the missing `x-csrf-token` header to the `fetch` calls in the course editor and course details pages.

## Root Cause
The server enforces CSRF protection for mutation requests (POST, PUT, PATCH, DELETE) by checking for an `x-csrf-token` header that matches the `csrf-token` cookie. The frontend code is currently making these requests without including the header, causing the server to reject them.

## Implementation Plan

### 1. Fix Course Editor Page
File: `src/app/admin/courses/new/edit/page.tsx`

-   Add a `getCsrfToken` helper function to read the token from the cookie.
-   Update the following `fetch` calls to include `x-csrf-token: getCsrfToken()` in the headers:
    -   `handleReorder` (PATCH)
    -   `handleAutoSave` (PUT)
    -   `handleUnitTypeSelect` (POST)
    -   `handleImport` (POST)
    -   `handleConfigChange` (PUT)
    -   `handleUnitTitleChange` (PUT)
    -   `handlePublish` (PATCH)
    -   `handleUnpublish` (PUT)
    -   `handleDuplicate` (PATCH)
    -   `handleDelete` (DELETE)
    -   `handlePublishUnit` (PATCH)
    -   `handleUnpublishUnit` (PATCH)
    -   `handleDuplicateUnit` (PATCH)
    -   `handleDeleteUnit` (DELETE)
    -   `handleMoveUnit` (PATCH)
    -   `handleSaveUnitOptions` (PUT)
    -   `handleFileUpload` (POST - FormData)
    -   `handleFileDelete` (DELETE)
    -   `handleImageUpload` (POST - FormData)
    -   `handleImageGenerate` (POST)

### 2. Fix Course Details Page
File: `src/app/admin/courses/[id]/page.tsx`

-   Add the `getCsrfToken` helper function.
-   Update `handleEnrollUsers` (POST) to include the `x-csrf-token` header.

## Verification
-   I will verify the fix by running a simulated `POST` request script (`debug-course-create.ts`) that includes the header, ensuring it returns `201` instead of `403`.
-   (User Verification) You should be able to add units, save changes, and enroll users without errors.