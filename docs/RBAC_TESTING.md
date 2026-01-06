# RBAC Testing Guide

This guide provides curl commands and testing steps to verify role-based access control on Course endpoints.

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@portal.com | Admin123! |
| Instructor | instructor@portal.com | Instructor123! |
| Learner | learner1@portal.com | Learner123! |

---

## Permission Matrix (Courses)

| Permission | ADMIN | SUPER_INSTRUCTOR | INSTRUCTOR | LEARNER |
|------------|-------|------------------|------------|---------|
| course:read | ✅ | ✅ | ✅ | ✅ |
| course:create | ✅ | ✅ | ✅ | ❌ |
| course:update | ✅ | ✅ | ✅ | ❌ |
| course:update_any | ✅ | ✅ | ❌ | ❌ |
| course:delete_any | ✅ | ❌ | ❌ | ❌ |
| course:publish | ✅ | ✅ | ✅ | ❌ |

---

## Automated Tests

Run the RBAC smoke tests:

```bash
npm run rbac:smoke
```

Expected output: 27/27 tests passed

---

## Curl Commands

### 1. Login as ADMIN

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portal.com","password":"Admin123!"}' \
  -c admin_cookies.txt
```

### 2. ADMIN creates course (expect 201)

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{"title":"Test Course","description":"RBAC test"}'
```

### 3. ADMIN deletes course (expect 200)

```bash
# Replace COURSE_ID with actual ID from step 2
curl -X DELETE http://localhost:3000/api/courses/COURSE_ID \
  -b admin_cookies.txt
```

### 4. Login as LEARNER

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"learner1@portal.com","password":"Learner123!"}' \
  -c learner_cookies.txt
```

### 5. LEARNER creates course (expect 403)

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -b learner_cookies.txt \
  -d '{"title":"Learner Course","description":"Should fail"}'
```

**Expected response:**
```json
{"error":"FORBIDDEN","reason":"Missing permission: course:create"}
```

### 6. LEARNER deletes course (expect 403)

```bash
curl -X DELETE http://localhost:3000/api/courses/any-id \
  -b learner_cookies.txt
```

**Expected response:**
```json
{"error":"FORBIDDEN","reason":"Missing permission: course:delete_any"}
```

---

## Permissions Endpoint

Get current user's permissions:

```bash
curl http://localhost:3000/api/auth/permissions -b admin_cookies.txt
```

**Response:**
```json
{
  "userId": "...",
  "activeRole": "ADMIN",
  "roles": ["ADMIN"],
  "permissions": [
    "course:read", "course:create", "course:update", 
    "course:update_any", "course:delete", "course:delete_any",
    "course:publish", "user:read", "user:create", ...
  ]
}
```

---

## UI Permission Hook

Use in React components:

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function CourseActions() {
  const { can, loading } = usePermissions();

  if (loading) return <Spinner />;

  return (
    <>
      {can('course:create') && <CreateButton />}
      {can('course:delete_any') && <DeleteButton />}
    </>
  );
}
```

---

## UI Manual Testing Checklist

### Test as ADMIN (admin@portal.com)
- [ ] Navigate to /admin/courses
- [ ] Verify "Add course" button is visible
- [ ] Verify Delete icons are visible for each course
- [ ] Verify "Delete Selected" button appears when selecting courses

### Test as INSTRUCTOR (instructor@portal.com)
- [ ] Navigate to /admin/courses
- [ ] Verify "Add course" button is visible (instructors can create)
- [ ] Verify Delete icons are HIDDEN (instructors cannot delete)
- [ ] Verify "Delete Selected" button does NOT appear

### Test as LEARNER (learner1@portal.com)
- [ ] Navigate to /admin/courses (if accessible)
- [ ] Verify "Add course" button is HIDDEN
- [ ] Verify Delete icons are HIDDEN
- [ ] Verify read-only view of courses

### Error Handling
- [ ] 401 Unauthorized → redirects to /login
- [ ] 403 Forbidden → shows "Access Denied" message
- [ ] 404 Not Found → shows "Not Found" message

---

## Learning Paths

### Permission Matrix

| Permission | ADMIN | SUPER_INSTRUCTOR | INSTRUCTOR | LEARNER |
|------------|-------|------------------|------------|---------|
| learning_path:read | ✅ | ✅ | ✅ | ✅ |
| learning_path:create | ✅ | ✅ | ✅ | ❌ |
| learning_path:update | ✅ | ✅ | ✅ | ❌ |
| learning_path:delete | ✅ | ✅ | ❌ | ❌ |

### Curl Examples

#### Create Learning Path (ADMIN)

```bash
curl -X POST http://localhost:3000/api/learning-paths \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{"name":"Test Learning Path"}'
```

#### Delete Learning Path (ADMIN)

```bash
curl -X DELETE http://localhost:3000/api/learning-paths/LP_ID \
  -b admin_cookies.txt
```

#### LEARNER denied create (expect 403)

```bash
curl -X POST http://localhost:3000/api/learning-paths \
  -H "Content-Type: application/json" \
  -b learner_cookies.txt \
  -d '{"name":"Learner LP"}'
```

### UI Checklist

#### Test as ADMIN
- [ ] Navigate to /admin/learning-paths
- [ ] Verify Create button is visible
- [ ] Verify Delete icons are visible

#### Test as INSTRUCTOR
- [ ] Navigate to learning paths
- [ ] Verify Create button is visible
- [ ] Verify Delete icons are HIDDEN

#### Test as LEARNER
- [ ] Verify Create button is HIDDEN
- [ ] Verify Delete icons are HIDDEN

---

## Remaining Modules (Reports, Calendar, Conference, Skills)

### Permission Matrix

| Module | Permission | ADMIN | SUPER_INSTRUCTOR | INSTRUCTOR | LEARNER |
|--------|------------|-------|------------------|------------|---------|
| Reports | report:read | ✅ | ✅ | ✅ | ❌ |
| Calendar | calendar:read | ✅ | ✅ | ✅ | ✅ |
| | calendar:create | ✅ | ✅ | ❌ | ❌ |
| Conference | conference:read | ✅ | ✅ | ✅ | ✅ |
| | conference:create| ✅ | ✅ | ❌ | ❌ |
| Skills | skills:read | ✅ | ✅ | ✅ | ✅ |
| | skills:create | ✅ | ✅ | ❌ | ❌ |

### Curl Examples

#### 1. ADMIN reads reports (expect 200)
```bash
curl http://localhost:3000/api/reports -b admin_cookies.txt
```

#### 2. LEARNER denied reports (expect 403)
```bash
curl http://localhost:3000/api/reports -b learner_cookies.txt
```

#### 3. ADMIN creates conference (expect 201)
```bash
curl -X POST http://localhost:3000/api/conferences \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{"title":"New Conf", "startTime":"2024-01-01T10:00:00Z"}'
```

### UI Checklist

#### Test as ADMIN
- [ ] Sidebar: Reports, Calendar, Conferences, Skills links are visible
- [ ] Calendar: "Create Event" button is visible
- [ ] Conferences: "New Conference" button is visible
- [ ] Skills: "Add Skill" button is visible

#### Test as LEARNER
- [ ] Sidebar: Reports link is HIDDEN
- [ ] Sidebar: Calendar, Conferences, Skills are visible (read-only)
- [ ] Calendar: "Create Event" button is HIDDEN
- [ ] Inner Pages: Verify `AccessDenied` if direct navigating to /instructor/reports

---

## Production Hardening

In production environments (`NODE_ENV=production`), RBAC is strictly enforced using database-backed permissions ONLY.

1.  **Fallback Disabled**: Hardcoded role rules in `permissions.ts` are disabled in production. If a user lacks a specific permission entry in the database, they are denied by default (403).
2.  **Debug Lockdown**: `/api/_debug/db` and `/dev/auth` return 404 in production to prevent data exposure.
3.  **Strict Mode**: If the database lookup for permissions fails or returns an empty list, a security alert is logged, and access is denied.

## RBAC Drift Protection

To prevent "permission drift" (where code uses permissions not yet seeded in the DB), use the rbac-lint tool.

### Running the Linter
```bash
npm run rbac:lint
```
This script scans all `src` files for `can()` and `requirePermission()` calls and compares them against the centralized registry.

### Adding New Permissions Safely

When adding a new feature that requires a permission:

1.  **Register it**: Add the string to `ALL_PERMISSIONS` in `src/lib/permissions-registry.ts`.
2.  **Map it**: Add it to appropriate roles in `DEFAULT_ROLE_PERMISSIONS` in the same file.
3.  **Sync it**: Run the dedicated RBAC seed to update the database:
    ```bash
    npx tsx scripts/seed-rbac.ts
    ```
4.  **Verify it**: Run `npm run rbac:lint` to ensure the linter is happy.
5.  **Test it**: Update and run `npm run rbac:smoke`.

## User RBAC Migration & Advanced Testing

The "Create User" flow now supports multi-role assignments, node-scoping, and granular permission overrides.

### Automated User RBAC Tests
```bash
npm run user:rbac:smoke
```
This script verifies:
1. Admin can create users with nodeId + role.
2. Instructors are denied user creation.
3. Privilege escalation (granting perms you don't have) is blocked.
4. Override precedence: **DENY always wins** over GRANT or Role.
5. Scoping: `switch-node` to an unassigned node returns 403.
6. Preview endpoint consistency.

---

## Database Schema & Constraints

The following tables handle the advanced RBAC logic:

| Table | Purpose | Unique Constraints |
|-------|---------|-------------------|
| `auth_user_role` | Maps users to roles per node | `userId_roleId_nodeId` |
| `user_permission_grant` | Direct permission grants | `userId_permissionId_nodeId` |
| `user_permission_deny` | Direct permission denies | `userId_permissionId_nodeId` |

> [!NOTE]
> `nodeId` can be `NULL` for Global assignments. However, due to Prisma/Postgres composite unique index behavior with NULLs, `prisma.upsert` on these tables requires careful handling (often using `updateMany` or manual check-then-create).

---

## Example SQL Queries for Manual Verification

Use these queries to inspect the RBAC state directly in the database.

### 1. View all role assignments for a user
```sql
SELECT u.email, r.name as role, n.name as node 
FROM auth_user_role aur
JOIN "User" u ON aur."userId" = u.id
JOIN auth_role r ON aur."roleId" = r.id
LEFT JOIN organization_node n ON aur."nodeId" = n.id
WHERE u.email = 'target@example.com';
```

### 2. View all permission overrides (grants/denies)
```sql
-- Grants
SELECT u.email, p.name as permission, n.name as node
FROM user_permission_grant upg
JOIN "User" u ON upg."userId" = u.id
JOIN auth_permission p ON upg."permissionId" = p.id
LEFT JOIN organization_node n ON upg."nodeId" = n.id
WHERE u.email = 'target@example.com';

-- Denies
SELECT u.email, p.name as permission, n.name as node
FROM user_permission_deny upd
JOIN "User" u ON upd."userId" = u.id
JOIN auth_permission p ON upd."permissionId" = p.id
LEFT JOIN organization_node n ON upd."nodeId" = n.id
WHERE u.email = 'target@example.com';
```

### 3. Check effective node-scoped permissions
To simulate what the backend sees when a user is acting in a specific node:
```sql
-- This is a conceptual query; the actual logic is in getUserPermissions()
WITH user_roles AS (
  SELECT p.name 
  FROM auth_user_role aur
  JOIN auth_role_permission arp ON aur."roleId" = arp."roleId"
  JOIN auth_permission p ON arp."permissionId" = p.id
  WHERE aur."userId" = 'USER_ID' AND (aur."nodeId" IS NULL OR aur."nodeId" = NODE_ID)
),
user_grants AS (
  SELECT p.name FROM user_permission_grant upg
  JOIN auth_permission p ON upg."permissionId" = p.id
  WHERE upg."userId" = 'USER_ID' AND (upg."nodeId" IS NULL OR upg."nodeId" = NODE_ID)
),
user_denies AS (
  SELECT p.name FROM user_permission_deny upd
  JOIN auth_permission p ON upd."permissionId" = p.id
  WHERE upd."userId" = 'USER_ID' AND (upd."nodeId" IS NULL OR upd."nodeId" = NODE_ID)
)
(SELECT name FROM user_roles UNION SELECT name FROM user_grants)
EXCEPT
SELECT name FROM user_denies;
```

---

## Learner End-to-End Flow

### Automated Tests
Run the comprehensive learner smoke test:
```bash
npm run learner:smoke
```
This script verifies:
1. Login and Enrollment retrieval.
2. Unit completion and progress tracking.
3. Assignment submission and retrieval.
4. Privacy: Learner B cannot access Learner A's submission.

### UI Manual Testing Checklist (Learner)

#### 1. Dashboard (`/learner`)
- [ ] Verify "Enrolled Courses" count is correct.
- [ ] Verify "Upcoming Assignments" list is populated.
- [ ] Verify progress bar accuracy for courses.

#### 2. Course Player (`/learner/course/[id]`)
- [ ] Verify unit list updates when units are marked complete.
- [ ] Verify "Mark as Complete" button correctly calls the progress API.
- [ ] Verify sidebar navigation locking (cannot skip uncompleted units).

#### 3. Assignment Submission (`/learner/assignment/[id]`)
- [ ] Verify text submission form is working.
- [ ] Verify file upload (if enabled) works correctly.
- [ ] Verify submission status changes to "SUBMITTED" after action.
- [ ] Verify "Learner Comment" can be saved for the instructor.

---

## Verification Scripts Summary

- `npm run auth:smoke`: Verifies JWT and Session logic.
- `npm run rbac:smoke`: Verifies endpoint-level permissions (27 tests).
- `npm run learner:smoke`: Verifies end-to-end learner flow and privacy.
- `npm run user:rbac:smoke`: Verifies User Creation, Overrides, and Scoping.
- `npm run rbac:lint`: Verifies codebase alignment with permission registry.
- `npx tsx scripts/seed-rbac.ts`: Idempotently syncs registry to DB.
