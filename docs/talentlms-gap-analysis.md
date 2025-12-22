# TalentLMS Gap Analysis

> Generated: 2024-12-19  
> Purpose: Identify existing modules, missing modules, mock pages, and priority order for implementation.

---

## 1. Executive Summary

The codebase has a solid foundation with 50+ Prisma models and basic UI scaffolding. However:
- **Auth is incomplete** - middleware is disabled, no role enforcement
- **Many pages are mocks** - using hardcoded arrays instead of DB
- **Non-TalentLMS modules exist** - Candidate/SuperAdmin routes should be disabled
- **3 roles only** - TalentLMS has Admin, Instructor, Learner (no Candidate/SuperAdmin)

---

## 2. Existing Modules (Working with DB)

| Module | Route | API | DB | Status |
|--------|-------|-----|----| -------|
| Users CRUD | `/admin/users` | ✅ `/api/users` | ✅ User model | **Partial** - needs bulk actions, unlock |
| Courses CRUD | `/admin/courses` | ✅ `/api/courses` | ✅ Course model | **Partial** - needs unit builder |
| Groups | `/admin/groups` | ✅ `/api/groups` | ❓ No model | **Stub** |
| Branches | `/admin/branches` | ✅ `/api/branches` | ✅ Branch model | **Partial** |
| Login | `/login` | ❓ `/api/auth/logout` only | ✅ sessions | **Partial** |

---

## 3. Mock Pages (Hardcoded Data)

These pages display UI but use static JavaScript arrays:

| Page | Route | Issue | Priority |
|------|-------|-------|----------|
| **Notifications** | `/admin/notifications` | Static `templates` array | 🔴 HIGH |
| **Automations** | `/admin/automations` | Static `automations` array | 🔴 HIGH |
| **Reports** | `/admin/reports` | Static `reportTypes` array | 🔴 HIGH |
| **Gamification** | `/admin/gamification` | Feature-flagged but mock | 🟡 MEDIUM |
| **Learning Paths** | `/admin/learning-paths` | Unknown | 🟡 MEDIUM |
| **Discussions** | `/admin/discussions` | Unknown | 🟡 MEDIUM |
| **Skills** | `/admin/skills` | Unknown | 🟡 MEDIUM |
| **Course Store** | `/admin/course-store` | Unknown | 🟢 LOW |
| **Subscription** | `/admin/subscription` | Unknown | 🟢 LOW |
| **Settings** | `/admin/settings` | Unknown | 🔴 HIGH |

---

## 4. Missing Modules (Not Implemented)

### Critical Missing
- [ ] **Real Auth Flow** - `/api/auth/login`, `/api/me`, role switching
- [ ] **RBAC Enforcement** - Middleware currently disabled (line 7 returns early)
- [ ] **Forgot/Reset Password** - No endpoints
- [ ] **Account Locking** - User model has fields but no logic

### TalentLMS Core Missing
- [ ] **Certificate Templates** - Model exists, no UI for editing
- [ ] **Homepage Builder** - Models exist, no UI
- [ ] **Scheduled Reports** - Model exists, no BullMQ jobs
- [ ] **Import/Export** - ImportJob model exists, no UI/processor
- [ ] **SCORM Player** - SCORMData model exists, no player page
- [ ] **File Library** - File model exists, no UI

### Learner/Instructor Missing
- [ ] **Course Player** - No unit consumption flow
- [ ] **My Courses (Learner)** - No enrollment-based listing
- [ ] **Catalog** - No self-enrollment
- [ ] **Grading Hub** - No instructor grading UI
- [ ] **ILT Sessions** - Model exists, no scheduling UI

---

## 5. Non-TalentLMS Modules (To Disable)

These routes don't exist in TalentLMS and should be disabled:

| Module | Routes | Action |
|--------|--------|--------|
| **Candidate** | `/candidate/*` (exams, onboarding, proctoring) | Disable, move behind feature flag |
| **SuperAdmin** | `/superadmin/*` (tenants, system-health) | Disable unless multi-tenant needed |

---

## 6. Prisma Schema Gaps

### Missing Models
```
- Role (enum exists but no relation table)
- UserRole (M:N for user-role assignment)
- EmailQueue (for notification sending)
- NotificationLog (for tracking sent notifications)
- Session (if refresh tokens needed)
- PasswordResetToken (for forgot password flow)
```

### Missing Fields on User
```prisma
// Need to add:
- roles UserRole[] (relation)
- activeRole String? (for role switching)
```

---

## 7. API Routes Gap

### Existing
```
/api/auth/logout     - POST (working)
/api/users           - GET, POST (working)
/api/users/[id]      - GET, PUT, DELETE (working)
/api/courses         - GET, POST (working)
/api/courses/[id]    - GET, PUT, DELETE (working)
/api/groups          - GET (partial)
/api/branches        - GET (partial)
/api/dashboard       - GET (partial)
```

### Missing (Critical)
```
/api/auth/login      - POST (validate credentials, create session)
/api/me              - GET (current user + roles)
/api/me/switch-role  - POST (change active role)
/api/auth/forgot-password - POST
/api/auth/reset-password  - POST

/api/notifications   - CRUD
/api/automations     - CRUD
/api/reports         - CRUD + generate
/api/certificates    - CRUD + issue
/api/discussions     - CRUD
```

---

## 8. Implementation Priority Order

### Priority 1: Auth + RBAC (BLOCKING)
1. Create Role/UserRole models in Prisma
2. Implement `/api/auth/login` with password validation
3. Enable middleware guards
4. Implement role switching
5. Disable candidate/superadmin routes

### Priority 2: Convert Mock Pages
1. **Reports** - Most visible, needs custom report builder
2. **Notifications** - Event-driven, needs email queue
3. **Automations** - Needs job scheduler (BullMQ)
4. **Settings** - Portal configuration

### Priority 3: Core Entity Completion
1. Users - bulk actions, unlock, profile tabs
2. Courses - unit builder, publish flow
3. Categories - hierarchy, import
4. Groups - membership, course assignment
5. Branches - branding, user scope

### Priority 4: Learning Experience
1. Course player with unit navigation
2. Learner catalog and enrollment
3. Instructor grading
4. Progress tracking

### Priority 5: Advanced Features
1. Certificate issuance
2. Gamification
3. Import/Export
4. SCORM player MVP
5. Homepage builder

---

## 9. Seed Data Requirements

Current seed is incomplete. Need:
```
- 1 Admin user (admin@portal.com / Admin123!)
- 1 Instructor user (instructor@portal.com / Instructor123!)
- 3 Learner users
- 10 courses (varied status, categories)
- 5 categories (hierarchical)
- 3 groups with members
- 2 branches
- Sample enrollments
- Timeline events
```

---

## 10. Files to Modify

### Immediate Actions
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add Role, UserRole, PasswordResetToken models |
| `src/middleware.ts` | Enable auth guards, remove early return |
| `src/lib/auth.ts` | Add requireAuth, requireRole helpers |
| `src/app/api/auth/login/route.ts` | CREATE - login endpoint |
| `src/app/api/me/route.ts` | CREATE - current user endpoint |
| `src/app/api/me/switch-role/route.ts` | CREATE - role switch |
| `src/app/(candidate)/*` | DISABLE - add feature flag |
| `src/app/(superadmin)/*` | DISABLE - add feature flag |

