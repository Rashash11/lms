# Auth, RBAC & Node Scoping Compliance Report

**Audit Date:** 2026-01-06  
**Status:** ✅ **FIXES APPLIED**

---

## Executive Summary

| Area | Status | Severity | Notes |
|------|--------|----------|-------|
| **A) Node ID Scoping** | ✅ PASS | 🟢 FIXED | Helpers added, routes updated |
| **B) DB-backed RBAC** | ✅ PASS | 🟢 FIXED | Admin-only overrides |
| **C) Stateless JWT** | ✅ PASS | 🟢 | Already compliant |

---

## A) NODE ID SCOPING — ✅ FIXED

### A1) Database Shape

**Decision Made:** Keep `branches` (UUID) as canonical nodeId with compatibility layer for `organization_node` (INTEGER) if needed.

### A2) Trusted Auth Context — ✅ FIXED

| Claim | Present in JWT | Source | Status |
|-------|---------------|--------|--------|
| userId | ✅ | Verified | ✅ |
| email | ✅ | Verified | ✅ |
| role | ✅ | `users.activeRole` | ✅ |
| nodeId | ✅ | `users.node_id` | ✅ FIXED |
| tokenVersion | ✅ | DB lookup | ✅ |

**Evidence:** [login/route.ts:104-112](file:///e:/lms/src/app/api/auth/login/route.ts#L104-L112)

### A3) Enforcement in Queries — ✅ FIXED

| Endpoint | Resource | Node Filter | Status |
|----------|----------|-------------|--------|
| `/api/users` | Users | `where: { nodeId: session.nodeId }` | ✅ PASS |
| `/api/courses` | Courses | `where: { branchId: session.nodeId }` | ✅ PASS |
| `/api/learning-paths` | LearningPaths | `where: { branchId: session.nodeId }` | ✅ PASS |
| `/api/assignments` | Assignments | Join via `course.branchId = session.nodeId` | ✅ PASS |
| `/api/auth/switch-node` | Session | Node exists + user access check | ✅ PASS |

**Evidence per route:**

- **Users:** [users/route.ts:56-72](file:///e:/lms/src/app/api/users/route.ts#L56-L72) — `enforceNodeWhere(session, where, 'nodeId')`
- **Courses:** [courses/route.ts:80-92](file:///e:/lms/src/app/api/courses/route.ts#L80-L92) — `enforceNodeWhere(session, where, 'branchId')`
- **Learning Paths:** [learning-paths/route.ts:44-55](file:///e:/lms/src/app/api/learning-paths/route.ts#L44-L55) — `enforceNodeWhere(session, where, 'branchId')`
- **Assignments:** [assignments/route.ts:122-125](file:///e:/lms/src/app/api/assignments/route.ts#L122-L125) — ADMIN: `where.course = { branchId: session.nodeId }`; LEARNER/INSTRUCTOR: scoped via enrollments/managed courses

### A4) Switch-Node Validation — ✅ FIXED

**Evidence:** [switch-node/route.ts:33-67](file:///e:/lms/src/app/api/auth/switch-node/route.ts#L33-L67)

- ✅ Validates node exists in `branches` table
- ✅ Checks node is active
- ✅ ADMIN can switch to any node (tenant-global)
- ✅ Non-ADMIN must be assigned to target node (`user.nodeId === targetNodeId`)

### Proof via Tests

**File:** [tests/auth-security.test.ts](file:///e:/lms/tests/auth-security.test.ts)

- ✅ Cross-node read returns 403 (Node Isolation tests)
- ✅ Cross-node write returns 403 (Node Isolation tests)
- ✅ Switch-node unauthorized returns 403 (Switch-Node Validation tests)

---

## B) DB-BACKED RBAC — ✅ PASS

### B1) DB Join Path — ✅ Correct

```typescript
// src/lib/permissions.ts
const rolePermissions = await prisma.authRolePermission.findMany({
    where: { role: { name: { in: roleNames } } },
    include: { permission: { select: { fullPermission: true } } },
});
```

### B2) Production Strictness — ✅ PASS

- Production: DB permissions only (strict)
- Development: Fallback with warning

### B3) Overrides Safety — ✅ FIXED

**Evidence:** [users/route.ts:176-181](file:///e:/lms/src/app/api/users/route.ts#L176-L181)

```typescript
if ((grantIds.length > 0 || denyIds.length > 0) && !isActorAdmin) {
    return NextResponse.json(
        { error: 'FORBIDDEN', reason: 'Only administrators can set permission overrides' },
        { status: 403 }
    );
}
```

---

## C) JWT (STATELESS) — ✅ PASS

| Check | Status | Evidence |
|-------|--------|----------|
| Algorithm locked | ✅ | `alg: "HS256"` |
| Signature required | ✅ | `jwtVerify()` |
| exp enforced | ✅ | `setExpirationTime()` |
| iat present | ✅ | `setIssuedAt()` |
| iss validated | ✅ | `issuer: "lms-auth"` |
| aud validated | ✅ | `audience: "lms-api"` |
| tokenVersion | ✅ | DB check on verify |
| Cookie security | ✅ | `httpOnly`, `sameSite`, `secure` |

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/auth.ts` | Added `requireNodeScope`, `enforceNodeWhere`, `isTenantGlobalAdmin` |
| `src/app/api/auth/login/route.ts` | nodeId included in JWT |
| `src/app/api/auth/switch-node/route.ts` | Node exists + access validation |
| `src/app/api/users/route.ts` | rbacOverrides admin-only, `where: { nodeId: session.nodeId }` |
| `src/app/api/courses/route.ts` | `where: { branchId: session.nodeId }` |
| `src/app/api/learning-paths/route.ts` | `where: { branchId: session.nodeId }` |
| `src/app/api/assignments/route.ts` | `where.course = { branchId: session.nodeId }` for ADMIN |
