# Production Deployment Checklist

## Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | HS256 signing key (min 32 chars) | `your-secure-random-string-here` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | Must be `production` | `production` |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `REQUIRE_VERIFIED` | `false` | Require email verification for login |
| `SKIP_RATE_LIMIT` | `0` | Set to `1` to disable rate limiting (testing only!) |

---

## Pre-Deploy Checklist

- [ ] `JWT_SECRET` is set and is a strong random string
- [ ] `NODE_ENV=production` is set
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] RBAC tables seeded (`npm run rbac:seed`)
- [ ] Test users removed or passwords changed

---

## Security Features

### Authentication
- Stateless JWT with 15-minute expiry
- httpOnly, secure, sameSite=lax cookies
- iss/aud/iat/exp claims validated

### Authorization
- DB-backed RBAC via `auth_role`, `auth_permission`, `auth_role_permission`
- **STRICT MODE**: In production, permissions come ONLY from database (no fallback)
- Permission cache: 60 seconds

### Rate Limiting
- Login: 5 attempts per minute per IP+email
- Switch-node: 10 attempts per minute per userId
- Returns 429 with Retry-After header

---

## Redis (Recommended for Scale)

For multi-instance deployments, replace the in-memory rate limiter with Redis:

```typescript
// Example Redis rate limiter (not included)
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(key: string, limit: number, windowSec: number) {
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, windowSec);
    }
    return count <= limit;
}
```

}
```

---

## Database Foreign Key Strategy (Hybrid Approach)

### Overview
This LMS uses a **hybrid foreign key strategy**: P0 critical tables have database-level FK constraints, while secondary/audit tables remain application-level only (via Prisma).

### Why Hybrid?
Prisma defaults to `relationMode = "prisma"` (application-level relations), so pgAdmin ERD shows tables as disconnected. We add database FKs for P0 tables to improve integrity and ERD visibility.

### P0 Tables with Database FKs
- `enrollments`, `password_reset_tokens`, `assignment_submissions`, `certificate_issues`, `test_attempts`, `tests`, `questions`, `auth_audit_log`
- **Total:** 14 FK constraints with CASCADE or SET NULL behaviors

### Commands
```powershell
# Apply FK constraints (aborts if orphans found)
.\scripts\apply-p0-fks.ps1

# Rollback
.\scripts\rollback-p0-fks.ps1
```

### Verify
pgAdmin → Tools → ERD Tool → Check relationships now visible

---

## Verification Commands

```bash
# Local verification before deploy
npm run rbac:lint      # Check permission strings
npm run auth:smoke     # Auth flow tests
npm run rbac:smoke     # RBAC enforcement tests
npm run test:security  # Full security test suite
```

---

## API Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 401 | UNAUTHORIZED | Authentication required or token invalid |
| 403 | FORBIDDEN | Missing permission |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | INTERNAL_ERROR | Server error |
