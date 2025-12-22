# LMS Feature Checklist

> **Rule**: Nothing is "done" unless UI + API + DB + docs are complete, OR feature is flagged with "Coming Soon" UI.

Last Updated: 2024-12-19

---

## Legend
- `[ ]` Planned
- `[/]` In Progress  
- `[x]` Done
- `[F]` Feature Flagged (UI exists with "Coming Soon")

---

## 🔴 SUPERADMIN FEATURES

### Tenant Management
- [ ] SA-001: Create/Edit/Delete Tenant
- [ ] SA-002: Domain/Subdomain Management
- [ ] SA-003: Global Feature Flags
- [ ] SA-004: Global Limits (uploads/users/storage)

### Monitoring
- [ ] SA-005: Global Audit Logs
- [ ] SA-006: System Health Page
- [ ] SA-007: Job Queue Monitoring (BullMQ)

### Admin Tools
- [F] SA-008: Impersonate Admin (FEATURE_IMPERSONATION)
- [F] SA-009: Global Announcements (FEATURE_ANNOUNCEMENTS)

---

## 🟠 ADMIN FEATURES

### Dashboard
- [x] AD-001: Admin Dashboard with KPIs

### Users & User Types
- [/] AD-002: Users Table (CRUD/Search/Filter)
- [ ] AD-003: User Create/Edit Form
- [ ] AD-004: User Bulk Actions
- [ ] AD-005: Password Reset / Unlock
- [ ] AD-006: User Types & Permission Tree
- [ ] AD-007: Custom User Fields Manager

### Branches
- [ ] AD-008: Branches CRUD
- [ ] AD-009: Branch User/Course Assignment
- [ ] AD-010: Branch Branding Override

### Courses
- [/] AD-011: Courses Table (CRUD)
- [x] AD-012: Course Create/Edit Wizard
- [ ] AD-013: Enrollment Management
- [ ] AD-014: Assign Instructors

### Categories
- [/] AD-015: Categories Hierarchy CRUD
- [ ] AD-016: Import Categories (CSV/XLSX)

### Groups
- [ ] AD-017: Groups CRUD + Members
- [ ] AD-018: Group Course Assignments
- [F] AD-019: Group Join Key (FEATURE_GROUP_JOIN_KEY)

### Learning Paths
- [ ] AD-020: Learning Paths CRUD
- [ ] AD-021: Learning Path Course Ordering
- [ ] AD-022: Learning Path Enrollments

### Certificates
- [x] AD-023: Certificate Template Editor
- [x] AD-024: Certificate Preview & PDF
- [ ] AD-025: Certificates Issued Listing

### Gamification
- [F] AD-026: Gamification Settings (FEATURE_GAMIFICATION)
- [F] AD-027: Badges/Levels Editor (FEATURE_GAMIFICATION)

### Notifications
- [ ] AD-028: Notification Templates
- [ ] AD-029: Event Triggers Setup
- [ ] AD-030: Notification Logs

### Automations
- [ ] AD-031: Automation Rule Builder
- [ ] AD-032: Automation Logs & Retry

### Reports
- [/] AD-033: Reports Dashboard
- [ ] AD-034: User Progress Report
- [ ] AD-035: Course Progress Report
- [ ] AD-036: Export CSV/XLSX
- [F] AD-037: Scheduled Reports (FEATURE_SCHEDULED_REPORTS)

### Discussions
- [ ] AD-038: Discussions Moderation
- [F] AD-039: Internal Messages (FEATURE_MESSAGES)

### Files
- [ ] AD-040: Asset Library

### Integrations & Settings
- [F] AD-041: SSO Settings (FEATURE_SSO_SAML)
- [F] AD-042: LDAP Settings (FEATURE_LDAP)
- [F] AD-043: SCIM Provisioning (FEATURE_SCIM)
- [F] AD-044: Conferencing (FEATURE_CONFERENCING)
- [ ] AD-045: API Keys Management
- [ ] AD-046: Branding/Theme Settings

### Candidates
- [x] AD-047: Candidates Live Proctoring
- [x] AD-048: Candidates Test Attempts
- [x] AD-049: Candidates Rescheduling
- [x] AD-050: Candidates Imported Results
- [x] AD-051: Personal Report (7 tabs)

---

## 🟡 INSTRUCTOR FEATURES

### Dashboard
- [ ] IN-001: Instructor Dashboard

### Course Authoring
- [ ] IN-002: My Courses List
- [ ] IN-003: Course Editor (Unit Builder)
- [ ] IN-004: Course Files Management
- [ ] IN-005: Course Discussions

### Learner Management
- [ ] IN-006: Course Learners List
- [ ] IN-007: Learner Progress View
- [F] IN-008: Message Learners (FEATURE_MESSAGES)

### Grading
- [ ] IN-009: Grading Hub
- [ ] IN-010: Assignment Grading
- [ ] IN-011: Test Manual Grading
- [ ] IN-012: Bulk Grading Actions

### ILT
- [ ] IN-013: ILT Sessions Management
- [ ] IN-014: Attendance Marking
- [ ] IN-015: Attendance Export

### Reports
- [ ] IN-016: Instructor Reports

---

## 🟢 LEARNER FEATURES

### Dashboard
- [ ] LR-001: Learner Dashboard

### Courses
- [ ] LR-002: My Courses List
- [ ] LR-003: Course Catalog
- [ ] LR-004: Course Detail Page
- [ ] LR-005: Self-Enrollment

### Course Player
- [ ] LR-006: Course Player
- [ ] LR-007: Unit Progress Tracking
- [ ] LR-008: Video Playback
- [ ] LR-009: File Downloads

### Assessments
- [ ] LR-010: Take Quiz/Test
- [ ] LR-011: Test Results Page
- [ ] LR-012: Submit Survey
- [ ] LR-013: Submit Assignment
- [ ] LR-014: View Assignment Feedback

### ILT
- [ ] LR-015: View ILT Sessions
- [ ] LR-016: Join Meeting URL

### Achievements
- [ ] LR-017: My Certificates
- [ ] LR-018: Download Certificate PDF
- [F] LR-019: Badges & Points (FEATURE_GAMIFICATION)
- [F] LR-020: Leaderboard (FEATURE_GAMIFICATION)

### Social
- [ ] LR-021: Course Discussions
- [F] LR-022: Messages Inbox (FEATURE_MESSAGES)

---

## 🔵 CANDIDATE FEATURES

### Profile
- [ ] CA-001: Candidate Dashboard
- [ ] CA-002: Candidate Profile
- [ ] CA-003: Onboarding Checklist

### Exams
- [ ] CA-004: Assigned Exams List
- [ ] CA-005: Exam Eligibility Checks
- [ ] CA-006: Exam Player
- [ ] CA-007: Exam Timer & Autosave
- [ ] CA-008: View Exam Results

### Proctoring
- [F] CA-009: Proctoring Session Start (FEATURE_PROCTORING)
- [F] CA-010: Proctoring Alerts Display (FEATURE_PROCTORING)

---

## ⚙️ INFRASTRUCTURE

### Auth
- [x] INFRA-001: JWT Auth with httpOnly Cookies
- [x] INFRA-002: Login Page
- [/] INFRA-003: Role-Based Middleware
- [ ] INFRA-004: Permission Guard (API)
- [ ] INFRA-005: Permission Guard (Routes)

### Database
- [x] INFRA-006: Prisma Schema (50+ models)
- [x] INFRA-007: Database Migrations
- [/] INFRA-008: Seed Script (all roles)

### API
- [/] INFRA-009: API Routes Structure
- [ ] INFRA-010: Zod Validation
- [/] INFRA-011: Error Handling

### Jobs
- [ ] INFRA-012: BullMQ Setup
- [ ] INFRA-013: Redis Connection

### Exports
- [ ] INFRA-014: CSV Export
- [ ] INFRA-015: XLSX Export
- [ ] INFRA-016: PDF Generation (Puppeteer)

### Docker
- [ ] INFRA-017: Docker Compose
- [ ] INFRA-018: Production Dockerfile

---

## 📊 PROGRESS SUMMARY

| Role | Total | Done | In Progress | Flagged | Planned |
|------|-------|------|-------------|---------|---------|
| SuperAdmin | 9 | 0 | 0 | 2 | 7 |
| Admin | 51 | 12 | 4 | 9 | 26 |
| Instructor | 16 | 0 | 0 | 1 | 15 |
| Learner | 22 | 0 | 0 | 4 | 18 |
| Candidate | 10 | 0 | 0 | 2 | 8 |
| Infrastructure | 18 | 5 | 4 | 0 | 9 |
| **TOTAL** | **126** | **17** | **8** | **18** | **83** |

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Core Auth & RBAC (Current)
- [ ] Role-based sidebar per role
- [ ] Permission middleware
- [ ] Role switching UI
- [ ] Seed all 5 role users

### Phase 2: Admin Essentials
- [ ] Users complete CRUD
- [ ] Branches
- [ ] Courses with enrollments
- [ ] Categories import

### Phase 3: Instructor & Learner Core
- [ ] Instructor dashboard + courses
- [ ] Learner dashboard + catalog
- [ ] Course player

### Phase 4: Assessments
- [ ] Test/Quiz taking
- [ ] Grading hub
- [ ] Candidate exam flow

### Phase 5: Advanced
- [ ] Learning paths
- [ ] Certificates
- [ ] Reports + exports
- [ ] Notifications
