# AUTHENTICATION & RBAC AUDIT - VERIFICATION CHECKLIST

## Quick Command Reference

### Database Validation
```powershell
# Run SQL validation queries
psql -h localhost -p 5433 -U lms_user -d lms_db -f scripts/validate-auth-db.sql
```

### Manual API Testing

**1. Login Test**
```powershell
# Login and save cookie
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@portal.com\",\"password\":\"Admin123!\"}' `
  -c cookies.txt -v
```

**Expected**: `{"ok":true,"userId":"...","role":"ADMIN"}` + Set-Cookie header

**2. Get Current User**
```powershell
curl -X GET http://localhost:3001/api/auth/me -b cookies.txt
```

**Expected**: 
```json
{
  "ok": true,
  "claims": {
    "userId": "...",
    "email": "admin@portal.com",
    "role": "ADMIN",
    "tokenVersion": 0
  },
  "user": { ... }
}
```

**3. Get Permissions**
```powershell
curl -X GET http://localhost:3001/api/auth/permissions -b cookies.txt
```

**Expected**: `{"permissions":["user:read","user:create",...]}` (array from DB)

**4. Logout All Sessions**
```powershell
curl -X POST http://localhost:3001/api/auth/logout-all -b cookies.txt
```

**Expected**: `{"ok":true,"message":"..."}`

**5. Verify Token Revoked**
```powershell
curl -X GET http://localhost:3001/api/auth/me -b cookies.txt
```

**Expected**: `{"error":"UNAUTHORIZED","message":"Token has been revoked"}` (401)

---

## Verification Checklist

### ✅ What Works
- [x] JWT stored in httpOnly cookie named "session"
- [x] Token signature validation (HS256)
- [x] Token revocation via tokenVersion
- [x] Error responses return JSON (not HTML)
- [x] 401 for missing/invalid tokens
- [x] 403 for permission denied
- [x] Login rate limiting
- [x] Password hashing (bcrypt)
- [x] RBAC table structure exists
- [x] Permission fetching from database
- [x] User-specific grants/denies

### ⚠️ Issues Found

#### CRITICAL
- [ ] **70+ routes missing authentication** (see audit report)
- [ ] **Missing nodeId in JWT claims** - Node scoping won't work

#### HIGH
- [ ] **25+ routes missing permission checks**
- [ ] No node-based filtering in queries

#### MEDIUM
- [ ] Short token expiry (15 min) without automatic refresh
- [ ] Some admin routes are unprotected

---

## Files Changed/Created

### Created
- `scripts/scan-api-routes.js` - Route inventory generator
- `scripts/validate-auth-db.sql` - DB validation queries  
- `scripts/test-auth-flow.js` - Automated auth flow tests
- `scripts/verify-auth.md` - This checklist
- `auth_audit_report.md` - Comprehensive audit report

### To Fix (Recommendations)
- `src/app/api/auth/login/route.ts` - Add nodeId to JWT
- `src/lib/auth.ts` - Update AuthContext interface with nodeId
- `src/app/api/branches/**` - Add requireAuth()
- `src/app/api/admin/notifications/**` - Add requireAuth()
- `src/app/api/automations/**` - Add requireAuth()
- (See full list in audit report)

---

## JWT Claims Validation

### Current Claims  
```typescript
{ 
  userId, email, role, tokenVersion,
  iat, exp, iss, aud
}
```

### Missing
- `nodeId` - Required for branch scoping

### To Add
Update `src/app/api/auth/login/route.ts` line 105-110:
```typescript
const token = await signAccessToken({
  userId: user.id,
  email: user.email,
  role: user.activeRole as RoleKey,
  nodeId: user.node_id,  // ← ADD THIS
  tokenVersion: userTokenVersion,
});
```

---

## Database Schema Check

Run these queries to verify RBAC tables:

```sql
-- 1. Check RBAC tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('auth_role', 'auth_permission', 'auth_role_permission')
ORDER BY table_name;

-- 2. Count permissions by role
SELECT ar.name, COUNT(arp.permission_id) as perm_count
FROM auth_role ar
LEFT JOIN auth_role_permission arp ON ar.id = arp.role_id
GROUP BY ar.name;

-- 3. Verify ADMIN has permissions
SELECT COUNT(*) as admin_permission_count
FROM auth_role ar
JOIN auth_role_permission arp ON ar.id = arp.role_id
WHERE ar.name = 'ADMIN';
```

---

## Next Steps

### Immediate (Critical)
1. Add `nodeId` to JWT claims
2. Add authentication to unprotected admin routes
3. Test node scoping if required

### Short-term  
1. Add permission checks to protected routes
2. Implement node-based query filtering
3. Document API authentication requirements

### Optional
1. Extend token expiry or implement refresh
2. Add automated tests to CI/CD
3. Create session management UI

---

## Summary

**Overall Status**: ✅ Functional but needs hardening

The authentication system has a solid foundation with JWT, token revocation, and RBAC. However, many routes lack protection and node scoping is incomplete. Priority should be adding auth guards to unprotected routes and implementing nodeId in JWT.

**Security Grade**: C+ (Functional but needs hardening)
