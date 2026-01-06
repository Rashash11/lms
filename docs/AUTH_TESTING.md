# JWT Authentication Testing Guide

This guide provides curl commands and browser testing steps to verify the JWT authentication with refresh token rotation.

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@portal.com | Admin123! |
| Super Instructor | superinstructor@portal.com | Super123! |
| Instructor | instructor@portal.com | Instructor123! |
| Learner | learner1@portal.com | Learner123! |

---

## Curl Commands

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portal.com","password":"Admin123!"}' \
  -c cookies.txt -v
```

**Expected:**
- Status 200
- Response: `{"ok":true,"user":{...},"roles":["ADMIN",...],"activeRole":"ADMIN"}`
- Cookies set: `session` and `refreshToken`

### 2. Verify Session (Get /me)

```bash
curl http://localhost:3000/api/auth/me -b cookies.txt
```

**Expected:**
- Status 200
- Returns JWT claims + user data with `ver` (tokenVersion)

### 3. Refresh Token

```bash
# Save new cookies to cookies2.txt
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt -c cookies2.txt -v
```

**Expected:**
- Status 200
- New cookies set with rotated tokens

### 4. Old Refresh Token Should Fail

```bash
# Using old cookies (cookies.txt), the old refresh token should be invalid
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt
```

**Expected:**
- Status 401
- `{"ok":false,"error":"Invalid or expired refresh token"}`

### 5. Logout All Sessions

```bash
curl -X POST http://localhost:3000/api/auth/logout-all \
  -b cookies2.txt -v
```

**Expected:**
- Status 200
- Both cookies cleared
- User's `tokenVersion` incremented

### 6. Old Access Token Should Fail

```bash
# After logout-all, the old access token should be invalid
curl http://localhost:3000/api/auth/me -b cookies2.txt
```

**Expected:**
- Status 401 (tokenVersion mismatch)

### 7. Single Logout

```bash
# Login first to get fresh cookies
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portal.com","password":"Admin123!"}' \
  -c cookies3.txt

# Then logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies3.txt -v
```

**Expected:**
- Status 200
- Cookies cleared
- That specific session revoked (but other sessions still valid)

---

## Browser Testing Checklist

1. **Navigate to** http://localhost:3000/login
2. **Login** with `admin@portal.com` / `Admin123!`
3. **Open DevTools** → Application → Cookies
4. **Verify cookies exist:**
   - `session` (httpOnly, path="/")
   - `refreshToken` (httpOnly, path="/api/auth")
5. **Navigate** to different pages - should stay logged in
6. **Wait 15+ minutes** or manually expire access token
7. **Navigate** to protected page - should auto-refresh and stay logged in
8. **Test Logout All:**
   - Open second browser/incognito
   - Login with same account
   - In first browser, call logout-all
   - Second browser should be logged out on next request

---

## Database Verification

Run these SQL queries to verify the implementation:

```sql
-- Check auth_sessions
SELECT id, "userId", "createdAt", "revokedAt", "replacedBySessionId", ip
FROM auth_sessions 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check auth_audit_events
SELECT id, "userId", "eventType", ip, "createdAt"
FROM auth_audit_events 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Check user tokenVersion (should increment after logout-all)
SELECT id, email, "tokenVersion", "lastLoginAt"
FROM users 
WHERE email = 'admin@portal.com';
```

---

## Token Lifetimes

| Token | Lifetime | Cookie Path |
|-------|----------|-------------|
| Access Token (JWT) | 15 minutes | `/` |
| Refresh Token | 30 days | `/api/auth` |

---

## Security Features

- ✅ **httpOnly cookies** - prevents XSS token theft
- ✅ **Secure flag** in production
- ✅ **sameSite=lax** - CSRF protection
- ✅ **Refresh token rotation** - old tokens invalidated immediately
- ✅ **tokenVersion** - global session invalidation
- ✅ **Audit logging** - all auth events logged
- ✅ **Account lockout** - after 10 failed attempts
