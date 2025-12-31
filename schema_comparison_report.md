# Schema Comparison Report
## Production (`new_schema`) vs Local (`schema.prisma`)

**Generated:** December 31, 2025

---

## Overview

| Metric | Local Prisma Schema | Production Schema |
|--------|--------------------:|------------------:|
| Lines | 1,573 | 1,141 |
| Tables/Models | ~75 | ~85 |
| Format | Prisma DSL | PostgreSQL DDL |

---

## Major Structural Differences

### 1. Multi-Tenancy & Organization

| Aspect | Local (Prisma) | Production |
|--------|----------------|------------|
| **Structure** | `Tenant` → `Branch` (flat) | `org` → `organization_node` (tree) |
| **Hierarchy** | 2 levels max | Unlimited depth with `parent_id` |
| **Path** | None | `ltree` path for fast queries |
| **Node Types** | Hardcoded | Dynamic via `node_types` table |

### 2. Content/Product Model

| Aspect | Local (Prisma) | Production |
|--------|----------------|------------|
| **Base Entity** | `Course` | `products` (generic) |
| **Types** | `CourseUnit.type` enum | `product_types` table |
| **Books** | Not supported | `book_reading_details`, `book_sections` |
| **Videos** | Part of unit config | Dedicated `videos`, `book_videos` tables |
| **Chapters** | `CourseSection` | `chapters` with `quiz_id` |

### 3. User & Permissions

| Aspect | Local (Prisma) | Production |
|--------|----------------|------------|
| **Roles** | `RoleKey` enum (4 roles) | `auth_role` table (dynamic) |
| **Permissions** | JSON in `UserType` | `auth_permission` + `auth_role_permission` |
| **Assignment** | `UserRole` (user ↔ role) | `user_role_permission` (user ↔ role ↔ node ↔ permission) |
| **Scope** | Global | Per organization node |

### 4. Skills & Knowledge

| Aspect | Local (Prisma) | Production |
|--------|----------------|------------|
| **Model** | Flat `Skill` | Hierarchy: `track` → `competency` → `specific_skill` → `knowledge_atom` |
| **Levels** | `SkillLevel` enum | `levels` + `skill_level` tables |
| **Objectives** | Not present | `objectives` + `objective_bloom_level` |
| **Misconceptions** | Not present | `misconceptions` + `user_misconceptions` |

### 5. Quizzes & Assessments

| Aspect | Local (Prisma) | Production |
|--------|----------------|------------|
| **Quiz** | `Test` model | `quizzes` with `quiz_type` |
| **Questions** | Single table | `questions` + `question_type` + `difficulty` |
| **Answers** | JSON in `options` | `answer_choices` table |
| **Attempts** | `TestAttempt` | `user_quiz_attempts` + `attempt_answers` + `attempt_question_links` |
| **Points** | Simple scoring | `fixed_points` + `objective_bloom_level.base_point` |

### 6. Internationalization

| Aspect | Local (Prisma) | Production |
|--------|----------------|------------|
| **Approach** | Single language field | Dedicated `*_languages` tables |
| **Languages** | Hardcoded strings | `languages` master table |
| **Coverage** | Limited | 15+ translation tables |

---

## Tables Only in Production (NOT in Local)

### Core Content
- `products` - Generic learning product abstraction
- `product_types`, `product_languages`, `product_categories`
- `book_reading_details`, `book_sections`, `book_videos`
- `paragraphs` - Video/book transcripts

### Knowledge Graph
- `knowledge_atom` - Atomic knowledge units
- `competency` - Skill competencies
- `specific_skill` - Specific skills
- `track` - Learning tracks
- `specific_skill_level_description`

### Organization
- `org` - Organizations
- `organization_node` - Hierarchical org structure
- `node_types` - Dynamic node types
- `product_node` - Product visibility per node

### XP & Gamification
- `xp_types` - XP activity types
- `xp_user_logs` - XP event log
- `xp_levels_lookup` - Level thresholds
- `user_xp_summary` - User XP totals

### AI Features
- `ai_coach_sessions` - AI coaching sessions
- `chats` - Chat conversations
- `messages` - Chat messages

### Other
- `custom_pathways`, `custom_pathway_items` - Custom learning paths
- `user_video_progress` - Detailed video tracking
- `instructor_ratings` - Instructor reviews
- `misconceptions`, `user_misconceptions` - Learning gaps
- `objectives`, `objective_bloom_level`, `question_objectives` - Learning objectives
- `video_knowledge_atoms`, `video_objectives` - Video metadata
- `user_waiting_list` - Product waitlist
- `user_education`, `user_experiences` - User profile
- `companies`, `company_certificate` - B2B companies
- `certificates` - Certificate definitions
- `service`, `org_service`, `user_service` - Service management

---

## Tables Only in Local (NOT in Production)

### Multi-Tenancy
- `Tenant` - Portal tenants
- `Branch` - Tenant branches
- `PortalFeatureFlags` - Feature flags

### Course Structure
- `CourseVersion` - Course versioning/snapshots
- `CourseFile` - Course attachments
- `EnrollmentRequest` - Enrollment approval workflow
- `UnitAsset` - Unit media assets

### Learning Paths
- `LearningPathSection` - LP sections
- `LearningPathEnrollment` - LP enrollments

### Gamification
- `GamificationSettings` - Gamification config
- `PointsLedger` - Points transactions
- `Badge` - Badges
- `Level` - Levels
- `Reward` - Rewards

### Notifications
- `Notification` - Notification templates
- `NotificationHistory` - Sent notifications
- `NotificationQueue` - Scheduled notifications
- `Automation`, `AutomationLog` - Workflow automation

### Discussions & Messaging
- `Discussion`, `DiscussionComment` - Forum discussions
- `MessageThread`, `Message`, `MessageRecipient` - Direct messaging
- `MessagingPermissions` - Messaging permissions
- `DiscussionModerationSettings` - Moderation

### SCORM/xAPI
- `SCORMData` - SCORM runtime data
- `LRSStatement` - xAPI statements

### Portal
- `Homepage`, `HomepageSection` - Custom homepages
- `TalentLibraryCourse`, `AcquiredLibraryCourse` - Library content

### Reports
- `Report`, `ScheduledReport` - Custom reports
- `AnalyticsDashboard` - Dashboards
- `ReportExport` - Export jobs
- `TimelineEvent` - Activity timeline

### Integrations
- `Integration` - Third-party integrations
- `APIKey` - API keys
- `SSOConfig` - SSO configuration

### Admin
- `ImpersonationSession` - User impersonation
- `ImportJob`, `ImportResult` - Bulk imports
- `UploadPolicy` - Upload restrictions

### Grading
- `Test`, `Question`, `QuestionPool` - Test structure
- `FreeTextKeyword` - Free text grading
- `TestAttempt` - Test attempts
- `ILTSession`, `ILTAttendance` - ILT tracking

### Other
- `Category` - Course categories
- `Group`, `GroupMember`, `GroupCourse` - User groups
- `Prerequisite` - Course prerequisites
- `JobRole`, `RoleSkill` - Job role skills
- `SkillQuestion`, `SkillResource`, `SkillRecommendation` - Skill content
- `CertificateTemplate`, `CertificateIssue` - Certificates
- `CourseRatingSetting`, `CourseRating` - Course ratings
- `EnrollmentExtension` - Enrollment extensions
- `File`, `FileVisibility`, `Attachment` - File management

---

## Key Recommendations

### To Align with Production:

1. **Replace Tenant/Branch** with `org` + `organization_node` hierarchy
2. **Add Products Layer** - Abstract `Course` into `products` + `course_details`
3. **Implement i18n** - Create `*_languages` tables for all translatable content
4. **Add Knowledge Graph** - `track` → `competency` → `specific_skill` → `knowledge_atom`
5. **Add XP System** - `xp_types`, `xp_user_logs`, `xp_levels_lookup`
6. **Add AI Features** - `ai_coach_sessions`, `chats`, `messages`
7. **Restructure RBAC** - Node-scoped permissions with `user_role_permission`

### To Enhance Production:

1. **Add Versioning** - Course snapshots like `CourseVersion`
2. **Add Notifications** - Event-driven notification system
3. **Add Discussions** - Forum-style discussions
4. **Add Reporting** - Custom reports and dashboards
5. **Add SCORM/xAPI** - Standards-based content tracking
6. **Add Integrations** - SSO, API keys, webhooks

---

## Entity Relationship Summary

### Production Schema Core Flow:
```
org
 └── organization_node (tree)
      └── users (via user_role_permission)
      └── products
           ├── course_details → chapters → videos
           ├── book_reading_details → book_sections
           └── book_video_details → book_videos
```

### Local Schema Core Flow:
```
Tenant
 └── Branch
      └── User (via UserRole)
      └── Course
           └── CourseSection
                └── CourseUnit (all types)
```

---

*End of Report*
