# LMS Backend Migration Map

> **Generated**: 2026-01-07  
> **Source**: Next.js TypeScript API Routes  
> **Target**: Python FastAPI  

---

## 1. Auth Endpoints (`/api/auth/*`)

| Method | Path | Auth | RBAC | Node Scope | Response Schema |
|--------|------|------|------|------------|-----------------|
| POST | `/api/auth/login` | ❌ Public | ❌ | ❌ | `{ ok, userId, role }` + session cookie |
| POST | `/api/auth/logout` | ✅ | ❌ | ❌ | `{ ok, message }` + clear cookie |
| POST | `/api/auth/logout-all` | ✅ | ❌ | ❌ | `{ ok, message }` + tokenVersion++ |
| POST | `/api/auth/signup` | ❌ Public | ❌ | ❌ | `{ ok, userId }` |
| GET | `/api/auth/me` | ✅ | ❌ | ❌ | `{ ok, claims, user }` |
| GET | `/api/auth/permissions` | ✅ | ❌ | ❌ | `{ permissions: string[] }` |
| POST | `/api/auth/refresh` | Partial | ❌ | ❌ | New tokens |
| POST | `/api/auth/forgot-password` | ❌ Public | ❌ | ❌ | `{ ok, message }` |
| POST | `/api/auth/reset-password` | ❌ Token | ❌ | ❌ | `{ ok, message }` |
| POST | `/api/auth/switch-node` | ✅ | ❌ | ✅ Validate | `{ ok, nodeId }` + new token |

### Auth Behaviors

- **JWT Claims**: `userId`, `email`, `role`, `nodeId`, `tokenVersion`
- **JWT Settings**: HS256, iss=`lms-auth`, aud=`lms-api`, exp=15m
- **Cookie**: `session` (httpOnly, sameSite=lax, secure in prod, maxAge=15m)
- **Token Revocation**: `logout-all` increments `users.token_version` in DB
- **Light Verification**: Middleware uses `verifyAccessTokenLight()` (no DB)
- **Full Verification**: API routes use `verifyAccessToken()` (checks tokenVersion vs DB)

---

## 2. User Endpoints (`/api/users/*`)

| Method | Path | Auth | RBAC | Node Scope |
|--------|------|------|------|------------|
| GET | `/api/users` | ✅ | `user:read` | ✅ `enforceNodeWhere` |
| POST | `/api/users` | ✅ | `user:create` | ❌ Body nodeId |
| DELETE | `/api/users` | ✅ | `user:delete` | ❌ |
| PATCH | `/api/users` | ✅ | `user:update` | ❌ |
| GET | `/api/users/[id]` | ✅ | `user:read` | ✅ Single user |
| PUT | `/api/users/[id]` | ✅ | `user:update` | ✅ |
| DELETE | `/api/users/[id]` | ✅ | `user:delete` | ✅ |

### RBAC Rules for Users

- `user:create` requires `user:assign_role` if assigning roles
- Only ADMIN can assign ADMIN role
- Only ADMIN can set `rbacOverrides`
- Safety constraints prevent non-ADMIN from modifying ADMIN accounts

---

## 3. Course Endpoints (`/api/courses/*`)

| Method | Path | Auth | RBAC | Node Scope |
|--------|------|------|------|------------|
| GET | `/api/courses` | ✅ | `course:read` | ❌ (no branchId) |
| POST | `/api/courses` | ✅ | `course:create` | ❌ |
| DELETE | `/api/courses` | ✅ | `course:delete_any` | ❌ |
| PATCH | `/api/courses` | ✅ | `course:update_any` OR `course:publish` | ❌ |
| GET | `/api/courses/[id]` | ✅ | `course:read` | ❌ |
| PUT | `/api/courses/[id]` | ✅ | `course:update` OR `course:update_any` | ❌ |
| DELETE | `/api/courses/[id]` | ✅ | `course:delete` OR `course:delete_any` | ❌ |
| POST | `/api/courses/[id]/enroll` | ✅ | `enrollment:create` | ❌ |
| GET | `/api/courses/[id]/enrollments` | ✅ | `enrollment:read` | ❌ |

---

## 4. Learning Path Endpoints (`/api/learning-paths/*`)

| Method | Path | Auth | RBAC | Node Scope |
|--------|------|------|------|------------|
| GET | `/api/learning-paths` | ✅ | `learning_path:read` | ❌ |
| POST | `/api/learning-paths` | ✅ | `learning_path:create` | ❌ |
| GET | `/api/learning-paths/[id]` | ✅ | `learning_path:read` | ❌ |
| PUT | `/api/learning-paths/[id]` | ✅ | `learning_path:update` | ❌ |
| DELETE | `/api/learning-paths/[id]` | ✅ | `learning_path:delete` | ❌ |

---

## 5. Assignment Endpoints (`/api/assignments/*`)

| Method | Path | Auth | RBAC | Node Scope |
|--------|------|------|------|------------|
| GET | `/api/assignments` | ✅ | `assignment:read` | ❌ |
| POST | `/api/assignments` | ✅ | `assignment:create` | ❌ |
| GET | `/api/assignments/[id]` | ✅ | `assignment:read` | ❌ |
| PUT | `/api/assignments/[id]` | ✅ | `assignment:update` | ❌ |
| DELETE | `/api/assignments/[id]` | ✅ | `assignment:delete` | ❌ |
| GET | `/api/assignments/[id]/submissions` | ✅ | Role-based | ❌ |
| POST | `/api/assignments/[id]/submissions` | ✅ | LEARNER | ❌ |

---

## 6. Other Resource Endpoints

### Skills (`/api/skills/*`)
- GET/POST `/api/skills` — `skill:read`, `skill:create`
- GET/PUT/DELETE `/api/skills/[id]` — `skill:read`, `skill:update`, `skill:delete`

### Groups (`/api/groups/*`)
- GET/POST `/api/groups` — `group:read`, `group:create`
- GET/PUT/DELETE `/api/groups/[id]` — CRUD permissions

### Categories (`/api/categories/*`)
- GET/POST `/api/categories` — `category:read`, `category:create`
- GET/PUT/DELETE `/api/categories/[id]` — CRUD permissions

### Branches (`/api/branches/*`)
- GET/POST `/api/branches` — ADMIN only
- GET/PUT/DELETE `/api/branches/[id]` — ADMIN only

### Conferences (`/api/conferences/*`)
- GET/POST `/api/conferences` — `conference:read`, `conference:create`
- CRUD operations per conference

### Calendar Events (`/api/calendar-events/*`)
- GET/POST `/api/calendar-events` — `calendar:read`, `calendar:create`

### Notifications (`/api/notifications/*`)
- Full CRUD — ADMIN permissions

### Automations (`/api/automations/*`)
- Full CRUD — ADMIN permissions

### Reports (`/api/reports/*`)
- GET/POST — `report:read`, `report:create`

### Certificates (`/api/certificates/*`)
- GET — `certificate:read`

### Gamification (`/api/gamification/*`)
- GET — `gamification:read`

---

## 7. Node Scoping Rules

### How Node Scoping Works

1. **Non-ADMIN users** MUST have `nodeId` in JWT
2. **Node scope** is enforced via `enforceNodeWhere(context, where, 'nodeId')`
3. **ADMIN** bypasses node filtering (tenant-global access)
4. **Switch-node** validates node exists AND user has access

### Entities with Node Scoping

| Entity | Node Field | Applied |
|--------|------------|---------|
| User | `nodeId` | ✅ GET list |
| Branch | `id` (is the node) | N/A |
| Group | `branchId` | ❌ Not implemented |
| Course | N/A | ❌ No branchId in schema |

### Security Rules

- Never trust `nodeId` from request body for authorization
- Always use `context.nodeId` from verified JWT
- Cross-tenant access is NEVER allowed (even for ADMIN)

---

## 8. RBAC Permission Aggregation

### Flow
```
users.role → user_roles.roleKey → auth_role.name → auth_role_permission → auth_permission.fullPermission
```

### Overrides (users.rbac_overrides JSON)
```json
{
  "grants": ["permission:that:is:added"],
  "denies": ["permission:that:is:removed"]
}
```

**Precedence**: Denies > Grants

### Caching
- TTL: 60 seconds
- Key: `userId` (global, not node-specific in current impl)

---

## 9. Response Format Standards

All endpoints return JSON. Error responses follow:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "reason": "Optional detailed reason"
}
```

### Standard Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `TOO_MANY_REQUESTS` | 429 | Rate limit hit |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 10. Compatibility Notes

### Must Preserve

1. **Cookie name**: `session`
2. **JWT claims structure**: `userId`, `email`, `role`, `nodeId`, `tokenVersion`
3. **Response shapes**: Match existing frontend expectations
4. **Permission names**: Exact match with DB `auth_permission.fullPermission`
5. **Error response format**: `{ error, message, reason? }`

### Python Implementation Notes

- Use `python-jose` or `PyJWT` for HS256 signing
- Use `passlib[bcrypt]` for password hashing
- Use SQLAlchemy with asyncpg for async DB access
- Cookie handling via FastAPI `Response` headers
