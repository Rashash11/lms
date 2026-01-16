-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEACTIVATED', 'LOCKED');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('ADMIN', 'INSTRUCTOR', 'LEARNER', 'SUPER_INSTRUCTOR');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('TEXT', 'FILE', 'EMBED', 'VIDEO', 'TEST', 'SURVEY', 'ASSIGNMENT', 'ILT', 'CMI5', 'TALENTCRAFT', 'SECTION', 'WEB', 'AUDIO', 'DOCUMENT', 'IFRAME', 'SCORM', 'XAPI');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED_CHANGES');

-- CreateEnum
CREATE TYPE "UnlockType" AS ENUM ('NONE', 'AFTER_COURSE', 'AFTER_SCORE');

-- CreateEnum
CREATE TYPE "CourseOrderMode" AS ENUM ('SEQUENTIAL', 'ANY');

-- CreateEnum
CREATE TYPE "CompletionRule" AS ENUM ('ALL_COURSES_COMPLETED');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('CLASSIC', 'FANCY', 'MODERN', 'SIMPLE');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('EVERYONE', 'BRANCH', 'GROUP', 'COURSE', 'SPECIFIC_USERS');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "themeId" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "aiFeaturesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowedDomains" TEXT[],
    "badgeSet" TEXT NOT NULL DEFAULT 'old-school',
    "brandingFaviconUrl" TEXT,
    "brandingLogoUrl" TEXT,
    "creditsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultCourseImageUrl" TEXT,
    "defaultGroupId" TEXT,
    "defaultUserTypeId" TEXT,
    "disallowMainDomainLogin" BOOLEAN NOT NULL DEFAULT false,
    "ecommerceProcessor" TEXT,
    "externalAnnouncement" TEXT,
    "externalAnnouncementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "internalAnnouncement" TEXT,
    "internalAnnouncementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "maxRegistrations" INTEGER,
    "signupMode" TEXT NOT NULL DEFAULT 'direct',
    "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "termsOfService" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "bio" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "userTypeId" TEXT,
    "passwordHash" TEXT,
    "avatar" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "deactivateAt" TIMESTAMP(3),
    "activeRole" "RoleKey" NOT NULL DEFAULT 'LEARNER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "excludeFromEmails" BOOLEAN NOT NULL DEFAULT false,
    "certificatesArchive" JSONB,
    "rbac_overrides" JSONB,
    "node_id" TEXT,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleKey" "RoleKey" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullPermission" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_role_permission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_role_permission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "auth_audit_log" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "event_type" TEXT NOT NULL,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "hiddenFromCatalog" BOOLEAN NOT NULL DEFAULT false,
    "introVideoType" TEXT,
    "introVideoUrl" TEXT,
    "capacity" INTEGER,
    "timeLimit" INTEGER,
    "expiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessRetentionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "certificateTemplateId" TEXT,
    "coachEnabled" BOOLEAN NOT NULL DEFAULT false,
    "completionRule" TEXT NOT NULL DEFAULT 'all',
    "contentLocked" BOOLEAN NOT NULL DEFAULT false,
    "enrollmentRequestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "publicSharingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requiredLevel" INTEGER,
    "scoreCalculation" TEXT NOT NULL DEFAULT 'all',
    "showInCatalog" BOOLEAN NOT NULL DEFAULT true,
    "timeLimitType" TEXT,
    "unitsOrdering" TEXT NOT NULL DEFAULT 'sequential',
    "instructorId" TEXT,
    "lastPublishedAt" TIMESTAMP(3),
    "publishedVersionId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "thumbnail_url" TEXT,
    "subtitle" TEXT,
    "enrollmentKey" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dripEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dripType" TEXT,
    "dripValue" INTEGER,
    "order_index" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_versions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_files" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "enrollment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_instructors" (
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "course_instructors_pkey" PRIMARY KEY ("tenantId","courseId","userId")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "score" DECIMAL(5,2),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "certificateId" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_units" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'DRAFT',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "versionHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkSourceUnitId" TEXT,
    "sectionId" TEXT,
    "config" JSONB NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "course_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_assets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "name" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" VARCHAR(500),
    "maxMembers" INTEGER,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "autoEnroll" BOOLEAN NOT NULL DEFAULT false,
    "groupKey" TEXT,
    "price" DECIMAL(10,2),
    "instructorId" TEXT,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_courses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "limitDays" INTEGER,
    "accessRetention" INTEGER,
    "isSequential" BOOLEAN NOT NULL DEFAULT false,
    "certificateId" TEXT,
    "maxCourses" INTEGER NOT NULL DEFAULT 25,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "accessRetentionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "certificateType" "CertificateType",
    "completionDaysLimit" INTEGER,
    "courseOrderMode" "CourseOrderMode" NOT NULL DEFAULT 'ANY',
    "completionRule" "CompletionRule" NOT NULL DEFAULT 'ALL_COURSES_COMPLETED',
    "instructorId" TEXT,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_sections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_path_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_courses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minScore" INTEGER,
    "unlockCourseId" TEXT,
    "unlockType" "UnlockType" NOT NULL DEFAULT 'NONE',
    "sectionId" TEXT,

    CONSTRAINT "learning_path_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_enrollments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "role" "RoleKey" NOT NULL DEFAULT 'LEARNER',
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_path_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerequisites" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "pathIndex" INTEGER NOT NULL,
    "requiredCourseId" TEXT NOT NULL,
    "requiredLevel" INTEGER,

    CONSTRAINT "prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "aiInstructions" TEXT,
    "numQuestionsRequired" INTEGER NOT NULL DEFAULT 10,
    "timerDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "evidence" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_questions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "skill_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_skills" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "course_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_skills" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "learning_path_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_skills" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "requiredLevel" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "role_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_recommendations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_resources" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "skill_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instructorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conferences" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "endTime" TIMESTAMP(3) NOT NULL,
    "instructorId" TEXT NOT NULL,
    "meetingUrl" TEXT,
    "title" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conference_participants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conferenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conference_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lrs_statements" (
    "id" TEXT NOT NULL,
    "actor" JSONB NOT NULL,
    "verb" JSONB NOT NULL,
    "object" JSONB NOT NULL,
    "result" JSONB,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stored" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authority" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0.3',

    CONSTRAINT "lrs_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scorm_data" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "lessonStatus" TEXT,
    "lessonLocation" TEXT,
    "suspendData" TEXT,
    "scoreRaw" DOUBLE PRECISION,
    "scoreMax" DOUBLE PRECISION,
    "scoreMin" DOUBLE PRECISION,
    "sessionTime" TEXT,
    "totalTime" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scorm_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pointsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "badgesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "levelsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rewardsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "leaderboardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pointsPerLogin" INTEGER NOT NULL DEFAULT 10,
    "maxLevel" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "gamification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "pointsRequired" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "badge" TEXT,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "discountPercent" INTEGER,
    "criteria" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventKey" TEXT NOT NULL,
    "filterBranches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "filterCourses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "filterGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hoursOffset" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "messageBody" TEXT NOT NULL,
    "messageSubject" TEXT NOT NULL,
    "offsetDirection" TEXT,
    "recipientType" TEXT NOT NULL,
    "recipientUserId" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "eventKey" TEXT NOT NULL,
    "contextJson" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "filters" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "smartTags" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_issues" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "pathId" TEXT,
    "templateId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIssuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "linkedInShared" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "certificate_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "menuItems" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "homepageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "hasDivider" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_library_courses" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "previewTrailer" TEXT,
    "categories" JSONB NOT NULL,
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "license" JSONB NOT NULL,

    CONSTRAINT "talent_library_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acquired_library_courses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "libraryCourseId" TEXT NOT NULL,
    "localCourseId" TEXT NOT NULL,
    "hiddenFromCatalog" BOOLEAN NOT NULL DEFAULT true,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acquired_library_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ruleset" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "recipients" JSONB NOT NULL,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_dashboards" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "bannerImage" TEXT,
    "widgets" JSONB NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL,
    "filters" JSONB,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "branchId" TEXT,
    "eventType" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partition_key" TEXT NOT NULL DEFAULT to_char(CURRENT_TIMESTAMP, 'YYYY-MM'),

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audienceType" "AudienceType" NOT NULL,
    "audienceId" TEXT,
    "branchId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_comments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_moderation_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "editWindowHours" INTEGER NOT NULL DEFAULT 2,
    "moderatorRole" TEXT NOT NULL DEFAULT 'Instructor',
    "settings" JSONB NOT NULL,

    CONSTRAINT "discussion_moderation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impersonation_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "reason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "uploadedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_results" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "data" JSONB,

    CONSTRAINT "import_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planTier" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "maxSizeMB" INTEGER NOT NULL,
    "restrictions" JSONB,

    CONSTRAINT "upload_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_recipients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "message_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_permissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userTypeId" TEXT NOT NULL,
    "canMessageAdmins" BOOLEAN NOT NULL DEFAULT true,
    "canMessageUsers" BOOLEAN NOT NULL DEFAULT true,
    "canMessageInstructors" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "messaging_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT,
    "externalUrl" TEXT,
    "filesize" INTEGER,
    "mimeType" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_visibility" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "file_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assignmentUnitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "content" TEXT,
    "fileId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "score" INTEGER,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ilt_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "iltUnitId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerData" JSONB NOT NULL,

    CONSTRAINT "ilt_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ilt_attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "status" TEXT NOT NULL,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "comment" TEXT,

    CONSTRAINT "ilt_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "isRandomized" BOOLEAN NOT NULL DEFAULT false,
    "questionsToShow" INTEGER,
    "passingScore" INTEGER NOT NULL DEFAULT 50,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "testId" TEXT,
    "questionPoolId" TEXT,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "feedback" TEXT,
    "tags" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_pools" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT,
    "minQuestions" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_text_keywords" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "pointsModifier" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "free_text_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB NOT NULL,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_rating_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_rating_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_ratings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_extensions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" TEXT NOT NULL,
    "newExpirationDate" TIMESTAMP(3) NOT NULL,
    "extendedBy" UUID NOT NULL,
    "reason" TEXT,
    "extendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_feature_flags" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planTier" TEXT NOT NULL,
    "prerequisitesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "learningPathsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "learningPathsLimit" INTEGER,
    "messagingEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "portal_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_course_state" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lastUnitId" TEXT,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_course_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_deletedAt_idx" ON "tenants"("deletedAt");

-- CreateIndex
CREATE INDEX "branches_deletedAt_idx" ON "branches"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "branches_tenantId_slug_key" ON "branches"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "branches_tenantId_id_key" ON "branches"("tenantId", "id");

-- CreateIndex
CREATE INDEX "users_tenantId_deletedAt_status_idx" ON "users"("tenantId", "deletedAt", "status");

-- CreateIndex
CREATE INDEX "users_tenantId_email_idx" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "users_tenantId_activeRole_is_active_idx" ON "users"("tenantId", "activeRole", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_id_key" ON "users"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_username_key" ON "users"("tenantId", "username");

-- CreateIndex
CREATE INDEX "user_roles_tenantId_userId_idx" ON "user_roles"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_tenantId_userId_roleKey_key" ON "user_roles"("tenantId", "userId", "roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "auth_role_name_key" ON "auth_role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permission_name_key" ON "auth_permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permission_fullPermission_key" ON "auth_permission"("fullPermission");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tenantId_id_key" ON "password_reset_tokens"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "user_types_name_key" ON "user_types"("name");

-- CreateIndex
CREATE INDEX "courses_tenantId_status_deletedAt_idx" ON "courses"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "courses_tenantId_categoryId_idx" ON "courses"("tenantId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_tenantId_id_key" ON "courses"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_tenantId_code_key" ON "courses"("tenantId", "code");

-- CreateIndex
CREATE INDEX "course_sections_tenantId_courseId_idx" ON "course_sections"("tenantId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_tenantId_id_key" ON "course_sections"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_tenantId_courseId_order_index_key" ON "course_sections"("tenantId", "courseId", "order_index");

-- CreateIndex
CREATE INDEX "course_versions_tenantId_courseId_idx" ON "course_versions"("tenantId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_versions_tenantId_id_key" ON "course_versions"("tenantId", "id");

-- CreateIndex
CREATE INDEX "course_files_tenantId_courseId_idx" ON "course_files"("tenantId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_files_tenantId_id_key" ON "course_files"("tenantId", "id");

-- CreateIndex
CREATE INDEX "enrollment_requests_tenantId_courseId_idx" ON "enrollment_requests"("tenantId", "courseId");

-- CreateIndex
CREATE INDEX "enrollment_requests_tenantId_userId_idx" ON "enrollment_requests"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_requests_tenantId_id_key" ON "enrollment_requests"("tenantId", "id");

-- CreateIndex
CREATE INDEX "enrollments_tenantId_status_idx" ON "enrollments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "enrollments_tenantId_userId_status_idx" ON "enrollments"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "enrollments_tenantId_courseId_status_idx" ON "enrollments"("tenantId", "courseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_tenantId_id_key" ON "enrollments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_tenantId_userId_courseId_key" ON "enrollments"("tenantId", "userId", "courseId");

-- CreateIndex
CREATE INDEX "course_units_tenantId_courseId_idx" ON "course_units"("tenantId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_units_tenantId_id_key" ON "course_units"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_units_tenantId_courseId_order_index_key" ON "course_units"("tenantId", "courseId", "order_index");

-- CreateIndex
CREATE INDEX "unit_assets_tenantId_courseId_idx" ON "unit_assets"("tenantId", "courseId");

-- CreateIndex
CREATE INDEX "unit_assets_tenantId_unitId_idx" ON "unit_assets"("tenantId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_assets_tenantId_id_key" ON "unit_assets"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenantId_id_key" ON "categories"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenantId_name_key" ON "categories"("tenantId", "name");

-- CreateIndex
CREATE INDEX "groups_tenantId_deletedAt_idx" ON "groups"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "groups_tenantId_id_key" ON "groups"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_tenantId_groupKey_key" ON "groups"("tenantId", "groupKey");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_tenantId_groupId_userId_key" ON "group_members"("tenantId", "groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_courses_tenantId_groupId_courseId_key" ON "group_courses"("tenantId", "groupId", "courseId");

-- CreateIndex
CREATE INDEX "learning_paths_tenantId_deletedAt_idx" ON "learning_paths"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_tenantId_id_key" ON "learning_paths"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_tenantId_code_key" ON "learning_paths"("tenantId", "code");

-- CreateIndex
CREATE INDEX "learning_path_sections_tenantId_pathId_idx" ON "learning_path_sections"("tenantId", "pathId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_sections_tenantId_id_key" ON "learning_path_sections"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_courses_tenantId_id_key" ON "learning_path_courses"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_courses_tenantId_pathId_courseId_key" ON "learning_path_courses"("tenantId", "pathId", "courseId");

-- CreateIndex
CREATE INDEX "learning_path_enrollments_tenantId_status_idx" ON "learning_path_enrollments"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_enrollments_tenantId_id_key" ON "learning_path_enrollments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_enrollments_tenantId_userId_pathId_key" ON "learning_path_enrollments"("tenantId", "userId", "pathId");

-- CreateIndex
CREATE UNIQUE INDEX "prerequisites_tenantId_courseId_pathIndex_requiredCourseId_key" ON "prerequisites"("tenantId", "courseId", "pathIndex", "requiredCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_tenantId_id_key" ON "skills"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_tenantId_id_key" ON "user_skills"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_tenantId_userId_skillId_key" ON "user_skills"("tenantId", "userId", "skillId");

-- CreateIndex
CREATE INDEX "skill_questions_tenantId_skillId_idx" ON "skill_questions"("tenantId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_questions_tenantId_id_key" ON "skill_questions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_skills_tenantId_id_key" ON "course_skills"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_skills_tenantId_courseId_skillId_key" ON "course_skills"("tenantId", "courseId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_skills_tenantId_id_key" ON "learning_path_skills"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_skills_tenantId_learningPathId_skillId_key" ON "learning_path_skills"("tenantId", "learningPathId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_tenantId_id_key" ON "job_roles"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "role_skills_tenantId_id_key" ON "role_skills"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "role_skills_tenantId_roleId_skillId_key" ON "role_skills"("tenantId", "roleId", "skillId");

-- CreateIndex
CREATE INDEX "skill_recommendations_tenantId_toUserId_idx" ON "skill_recommendations"("tenantId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_recommendations_tenantId_id_key" ON "skill_recommendations"("tenantId", "id");

-- CreateIndex
CREATE INDEX "skill_resources_tenantId_skillId_idx" ON "skill_resources"("tenantId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_resources_tenantId_id_key" ON "skill_resources"("tenantId", "id");

-- CreateIndex
CREATE INDEX "calendar_events_tenantId_startTime_idx" ON "calendar_events"("tenantId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_tenantId_id_key" ON "calendar_events"("tenantId", "id");

-- CreateIndex
CREATE INDEX "conferences_tenantId_startTime_idx" ON "conferences"("tenantId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "conferences_tenantId_id_key" ON "conferences"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "conference_participants_tenantId_id_key" ON "conference_participants"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "conference_participants_tenantId_conferenceId_userId_key" ON "conference_participants"("tenantId", "conferenceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "scorm_data_tenantId_userId_unitId_key" ON "scorm_data"("tenantId", "userId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_settings_tenantId_id_key" ON "gamification_settings"("tenantId", "id");

-- CreateIndex
CREATE INDEX "points_ledger_tenantId_userId_idx" ON "points_ledger"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "points_ledger_tenantId_id_key" ON "points_ledger"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_tenantId_id_key" ON "badges"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "levels_tenantId_id_key" ON "levels"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "levels_tenantId_levelNumber_key" ON "levels"("tenantId", "levelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rewards_tenantId_id_key" ON "rewards"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_tenantId_id_key" ON "notifications"("tenantId", "id");

-- CreateIndex
CREATE INDEX "notification_history_tenantId_notificationId_idx" ON "notification_history"("tenantId", "notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_history_tenantId_id_key" ON "notification_history"("tenantId", "id");

-- CreateIndex
CREATE INDEX "notification_queue_tenantId_status_scheduledFor_idx" ON "notification_queue"("tenantId", "status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "notification_queue_tenantId_id_key" ON "notification_queue"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "automations_tenantId_id_key" ON "automations"("tenantId", "id");

-- CreateIndex
CREATE INDEX "automation_logs_tenantId_automationId_idx" ON "automation_logs"("tenantId", "automationId");

-- CreateIndex
CREATE UNIQUE INDEX "automation_logs_tenantId_id_key" ON "automation_logs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_tenantId_id_key" ON "certificate_templates"("tenantId", "id");

-- CreateIndex
CREATE INDEX "certificate_issues_tenantId_userId_idx" ON "certificate_issues"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_issues_tenantId_id_key" ON "certificate_issues"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "homepages_tenantId_id_key" ON "homepages"("tenantId", "id");

-- CreateIndex
CREATE INDEX "homepage_sections_tenantId_homepageId_idx" ON "homepage_sections"("tenantId", "homepageId");

-- CreateIndex
CREATE UNIQUE INDEX "homepage_sections_tenantId_id_key" ON "homepage_sections"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "talent_library_courses_externalId_key" ON "talent_library_courses"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "acquired_library_courses_tenantId_id_key" ON "acquired_library_courses"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "acquired_library_courses_tenantId_libraryCourseId_key" ON "acquired_library_courses"("tenantId", "libraryCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "reports_tenantId_id_key" ON "reports"("tenantId", "id");

-- CreateIndex
CREATE INDEX "scheduled_reports_tenantId_reportId_idx" ON "scheduled_reports"("tenantId", "reportId");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_reports_tenantId_id_key" ON "scheduled_reports"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_dashboards_tenantId_id_key" ON "analytics_dashboards"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "report_exports_tenantId_id_key" ON "report_exports"("tenantId", "id");

-- CreateIndex
CREATE INDEX "timeline_events_tenantId_timestamp_idx" ON "timeline_events"("tenantId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_events_tenantId_id_key" ON "timeline_events"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "discussions_tenantId_id_key" ON "discussions"("tenantId", "id");

-- CreateIndex
CREATE INDEX "discussion_comments_tenantId_discussionId_idx" ON "discussion_comments"("tenantId", "discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "discussion_comments_tenantId_id_key" ON "discussion_comments"("tenantId", "id");

-- CreateIndex
CREATE INDEX "attachments_tenantId_entityId_idx" ON "attachments"("tenantId", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_tenantId_id_key" ON "attachments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "discussion_moderation_settings_tenantId_id_key" ON "discussion_moderation_settings"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_tenantId_id_key" ON "integrations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_tenantId_id_key" ON "api_keys"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sso_configs_tenantId_id_key" ON "sso_configs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "impersonation_sessions_tenantId_id_key" ON "impersonation_sessions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "import_jobs_tenantId_id_key" ON "import_jobs"("tenantId", "id");

-- CreateIndex
CREATE INDEX "import_results_tenantId_importJobId_idx" ON "import_results"("tenantId", "importJobId");

-- CreateIndex
CREATE UNIQUE INDEX "import_results_tenantId_id_key" ON "import_results"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "upload_policies_tenantId_id_key" ON "upload_policies"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_tenantId_id_key" ON "message_threads"("tenantId", "id");

-- CreateIndex
CREATE INDEX "messages_tenantId_threadId_sentAt_idx" ON "messages"("tenantId", "threadId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "messages_tenantId_id_key" ON "messages"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "message_recipients_tenantId_id_key" ON "message_recipients"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "message_recipients_tenantId_threadId_userId_key" ON "message_recipients"("tenantId", "threadId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_permissions_tenantId_id_key" ON "messaging_permissions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "files_tenantId_id_key" ON "files"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "file_visibility_tenantId_id_key" ON "file_visibility"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "file_visibility_tenantId_fileId_userId_key" ON "file_visibility"("tenantId", "fileId", "userId");

-- CreateIndex
CREATE INDEX "assignment_submissions_tenantId_userId_idx" ON "assignment_submissions"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "assignment_submissions_tenantId_courseId_idx" ON "assignment_submissions"("tenantId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_tenantId_id_key" ON "assignment_submissions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ilt_sessions_tenantId_id_key" ON "ilt_sessions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ilt_attendance_tenantId_id_key" ON "ilt_attendance"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ilt_attendance_tenantId_sessionId_userId_key" ON "ilt_attendance"("tenantId", "sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "tests_tenantId_id_key" ON "tests"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_tenantId_id_key" ON "questions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "question_pools_tenantId_id_key" ON "question_pools"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "free_text_keywords_tenantId_id_key" ON "free_text_keywords"("tenantId", "id");

-- CreateIndex
CREATE INDEX "test_attempts_tenantId_userId_idx" ON "test_attempts"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "test_attempts_tenantId_testId_idx" ON "test_attempts"("tenantId", "testId");

-- CreateIndex
CREATE UNIQUE INDEX "test_attempts_tenantId_id_key" ON "test_attempts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_ratings_tenantId_id_key" ON "course_ratings"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "course_ratings_tenantId_courseId_userId_key" ON "course_ratings"("tenantId", "courseId", "userId");

-- CreateIndex
CREATE INDEX "enrollment_extensions_tenantId_enrollmentId_idx" ON "enrollment_extensions"("tenantId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_extensions_tenantId_id_key" ON "enrollment_extensions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_feature_flags_tenantId_key" ON "portal_feature_flags"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_tenantId_id_key" ON "assignments"("tenantId", "id");

-- CreateIndex
CREATE INDEX "learner_course_state_tenantId_userId_idx" ON "learner_course_state"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "learner_course_state_tenantId_courseId_idx" ON "learner_course_state"("tenantId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "learner_course_state_tenantId_id_key" ON "learner_course_state"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_course_state_tenantId_userId_courseId_key" ON "learner_course_state"("tenantId", "userId", "courseId");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_defaultGroupId_fkey" FOREIGN KEY ("defaultGroupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_defaultUserTypeId_fkey" FOREIGN KEY ("defaultUserTypeId") REFERENCES "user_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "user_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_permission" ADD CONSTRAINT "auth_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_permission" ADD CONSTRAINT "auth_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "auth_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_units" ADD CONSTRAINT "course_units_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_units" ADD CONSTRAINT "course_units_tenantId_sectionId_fkey" FOREIGN KEY ("tenantId", "sectionId") REFERENCES "course_sections"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_assets" ADD CONSTRAINT "unit_assets_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_assets" ADD CONSTRAINT "unit_assets_tenantId_unitId_fkey" FOREIGN KEY ("tenantId", "unitId") REFERENCES "course_units"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_tenantId_groupId_fkey" FOREIGN KEY ("tenantId", "groupId") REFERENCES "groups"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_courses" ADD CONSTRAINT "group_courses_tenantId_groupId_fkey" FOREIGN KEY ("tenantId", "groupId") REFERENCES "groups"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_courses" ADD CONSTRAINT "group_courses_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_tenantId_instructorId_fkey" FOREIGN KEY ("tenantId", "instructorId") REFERENCES "users"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_sections" ADD CONSTRAINT "learning_path_sections_tenantId_pathId_fkey" FOREIGN KEY ("tenantId", "pathId") REFERENCES "learning_paths"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_tenantId_pathId_fkey" FOREIGN KEY ("tenantId", "pathId") REFERENCES "learning_paths"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_tenantId_sectionId_fkey" FOREIGN KEY ("tenantId", "sectionId") REFERENCES "learning_path_sections"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "learning_path_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "learning_path_enrollments_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "learning_path_enrollments_tenantId_pathId_fkey" FOREIGN KEY ("tenantId", "pathId") REFERENCES "learning_paths"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_tenantId_skillId_fkey" FOREIGN KEY ("tenantId", "skillId") REFERENCES "skills"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_questions" ADD CONSTRAINT "skill_questions_tenantId_skillId_fkey" FOREIGN KEY ("tenantId", "skillId") REFERENCES "skills"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_tenantId_skillId_fkey" FOREIGN KEY ("tenantId", "skillId") REFERENCES "skills"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_skills" ADD CONSTRAINT "learning_path_skills_tenantId_learningPathId_fkey" FOREIGN KEY ("tenantId", "learningPathId") REFERENCES "learning_paths"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_skills" ADD CONSTRAINT "learning_path_skills_tenantId_skillId_fkey" FOREIGN KEY ("tenantId", "skillId") REFERENCES "skills"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skills" ADD CONSTRAINT "role_skills_tenantId_roleId_fkey" FOREIGN KEY ("tenantId", "roleId") REFERENCES "job_roles"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_skills" ADD CONSTRAINT "role_skills_tenantId_skillId_fkey" FOREIGN KEY ("tenantId", "skillId") REFERENCES "skills"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_recommendations" ADD CONSTRAINT "skill_recommendations_tenantId_fromUserId_fkey" FOREIGN KEY ("tenantId", "fromUserId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_recommendations" ADD CONSTRAINT "skill_recommendations_tenantId_skillId_fkey" FOREIGN KEY ("tenantId", "skillId") REFERENCES "skills"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_recommendations" ADD CONSTRAINT "skill_recommendations_tenantId_toUserId_fkey" FOREIGN KEY ("tenantId", "toUserId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_tenantId_skillId_fkey" FOREIGN KEY ("tenantId", "skillId") REFERENCES "skills"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenantId_instructorId_fkey" FOREIGN KEY ("tenantId", "instructorId") REFERENCES "users"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_tenantId_instructorId_fkey" FOREIGN KEY ("tenantId", "instructorId") REFERENCES "users"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_participants" ADD CONSTRAINT "conference_participants_tenantId_conferenceId_fkey" FOREIGN KEY ("tenantId", "conferenceId") REFERENCES "conferences"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorm_data" ADD CONSTRAINT "scorm_data_tenantId_unitId_fkey" FOREIGN KEY ("tenantId", "unitId") REFERENCES "course_units"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_settings" ADD CONSTRAINT "gamification_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_tenantId_notificationId_fkey" FOREIGN KEY ("tenantId", "notificationId") REFERENCES "notifications"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_tenantId_notificationId_fkey" FOREIGN KEY ("tenantId", "notificationId") REFERENCES "notifications"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_tenantId_automationId_fkey" FOREIGN KEY ("tenantId", "automationId") REFERENCES "automations"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_issues" ADD CONSTRAINT "certificate_issues_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepages" ADD CONSTRAINT "homepages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_tenantId_homepageId_fkey" FOREIGN KEY ("tenantId", "homepageId") REFERENCES "homepages"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquired_library_courses" ADD CONSTRAINT "acquired_library_courses_tenantId_localCourseId_fkey" FOREIGN KEY ("tenantId", "localCourseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquired_library_courses" ADD CONSTRAINT "acquired_library_courses_libraryCourseId_fkey" FOREIGN KEY ("libraryCourseId") REFERENCES "talent_library_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_tenantId_reportId_fkey" FOREIGN KEY ("tenantId", "reportId") REFERENCES "reports"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_tenantId_branchId_fkey" FOREIGN KEY ("tenantId", "branchId") REFERENCES "branches"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_comments" ADD CONSTRAINT "discussion_comments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_comments" ADD CONSTRAINT "discussion_comments_tenantId_discussionId_fkey" FOREIGN KEY ("tenantId", "discussionId") REFERENCES "discussions"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_moderation_settings" ADD CONSTRAINT "discussion_moderation_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_configs" ADD CONSTRAINT "sso_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_results" ADD CONSTRAINT "import_results_tenantId_importJobId_fkey" FOREIGN KEY ("tenantId", "importJobId") REFERENCES "import_jobs"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_results" ADD CONSTRAINT "import_results_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_policies" ADD CONSTRAINT "upload_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenantId_threadId_fkey" FOREIGN KEY ("tenantId", "threadId") REFERENCES "message_threads"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_recipients" ADD CONSTRAINT "message_recipients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_recipients" ADD CONSTRAINT "message_recipients_tenantId_threadId_fkey" FOREIGN KEY ("tenantId", "threadId") REFERENCES "message_threads"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_permissions" ADD CONSTRAINT "messaging_permissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_visibility" ADD CONSTRAINT "file_visibility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_visibility" ADD CONSTRAINT "file_visibility_tenantId_fileId_fkey" FOREIGN KEY ("tenantId", "fileId") REFERENCES "files"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_tenantId_fileId_fkey" FOREIGN KEY ("tenantId", "fileId") REFERENCES "files"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilt_sessions" ADD CONSTRAINT "ilt_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilt_sessions" ADD CONSTRAINT "ilt_sessions_tenantId_iltUnitId_fkey" FOREIGN KEY ("tenantId", "iltUnitId") REFERENCES "course_units"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilt_attendance" ADD CONSTRAINT "ilt_attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilt_attendance" ADD CONSTRAINT "ilt_attendance_tenantId_sessionId_fkey" FOREIGN KEY ("tenantId", "sessionId") REFERENCES "ilt_sessions"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_tenantId_unitId_fkey" FOREIGN KEY ("tenantId", "unitId") REFERENCES "course_units"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_tenantId_testId_fkey" FOREIGN KEY ("tenantId", "testId") REFERENCES "tests"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_pools" ADD CONSTRAINT "question_pools_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_pools" ADD CONSTRAINT "question_pools_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_text_keywords" ADD CONSTRAINT "free_text_keywords_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_text_keywords" ADD CONSTRAINT "free_text_keywords_tenantId_questionId_fkey" FOREIGN KEY ("tenantId", "questionId") REFERENCES "questions"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_tenantId_testId_fkey" FOREIGN KEY ("tenantId", "testId") REFERENCES "tests"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_rating_settings" ADD CONSTRAINT "course_rating_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_ratings" ADD CONSTRAINT "course_ratings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_ratings" ADD CONSTRAINT "course_ratings_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_ratings" ADD CONSTRAINT "course_ratings_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_extensions" ADD CONSTRAINT "enrollment_extensions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_extensions" ADD CONSTRAINT "enrollment_extensions_tenantId_enrollmentId_fkey" FOREIGN KEY ("tenantId", "enrollmentId") REFERENCES "enrollments"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_feature_flags" ADD CONSTRAINT "portal_feature_flags_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_course_state" ADD CONSTRAINT "learner_course_state_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_course_state" ADD CONSTRAINT "learner_course_state_tenantId_courseId_fkey" FOREIGN KEY ("tenantId", "courseId") REFERENCES "courses"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_course_state" ADD CONSTRAINT "learner_course_state_tenantId_lastUnitId_fkey" FOREIGN KEY ("tenantId", "lastUnitId") REFERENCES "course_units"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_course_state" ADD CONSTRAINT "learner_course_state_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "users"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
