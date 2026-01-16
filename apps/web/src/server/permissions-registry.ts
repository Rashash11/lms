import { RoleKey } from "./auth";

/**
 * Registry of all valid permission strings in the system.
 * This is the source of truth used by rbac:lint and database seeding.
 */
export const ALL_PERMISSIONS = [
    // Course
    'course:read', 'course:create', 'course:update', 'course:update_any', 'course:publish', 'course:delete', 'course:delete_any',
    // Unit
    'unit:read', 'unit:create', 'unit:update', 'unit:update_any', 'unit:publish', 'unit:delete', 'unit:delete_any',
    // Learning Paths
    'learning_path:read', 'learning_path:create', 'learning_path:update', 'learning_path:delete',
    // Users
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:assign_role', 'user:assign_permission', 'user:impersonate',
    // User Types
    'user_types:read',
    // Groups
    'group:read', 'group:create', 'group:update', 'group:delete',
    // Branches
    'branches:read', 'branches:create', 'branches:update', 'branches:delete',
    // Dashboard
    'dashboard:read',
    // Assignments
    'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
    // Submissions
    'submission:read', 'submission:grade', 'submission:publish', 'submission:download', 'submission:create',
    // Reports
    'reports:read', 'reports:export',
    // Calendar
    'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
    // Conference
    'conference:read', 'conference:create', 'conference:update', 'conference:delete',
    // Skills
    'skills:read', 'skills:update', 'skills:create', 'skills:delete',
    // Automations
    'automations:read', 'automations:create', 'automations:update', 'automations:delete',
    // Notifications
    'notifications:read', 'notifications:create', 'notifications:update', 'notifications:delete',
    // Security
    'security:sessions:read', 'security:sessions:revoke', 'security:audit:read',
    // Certificates
    'certificate:template:read', 'certificate:template:create', 'certificate:template:update', 'certificate:template:delete',
    'certificate:issue:read', 'certificate:issue:create', 'certificate:view_own',
    // Admin
    'roles:read', 'permissions:read', 'organization:read'
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

/**
 * Hardcoded permission fallbacks for development.
 * In PRODUCTION, these are ignored and DB permissions are required.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
    ADMIN: [...ALL_PERMISSIONS],
    SUPER_INSTRUCTOR: [
        'dashboard:read',
        'course:read', 'course:create', 'course:update', 'course:update_any', 'course:publish', 'course:delete',
        'unit:read', 'unit:create', 'unit:update', 'unit:update_any', 'unit:publish', 'unit:delete',
        'learning_path:read', 'learning_path:create', 'learning_path:update', 'learning_path:delete',
        'group:read', 'group:create', 'group:update', 'group:delete',
        'user:read', 'user:create', 'user:update', 'user:delete',
        'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
        'submission:read', 'submission:grade', 'submission:publish', 'submission:download',
        'reports:read', 'reports:export',
        'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
        'conference:read', 'conference:create', 'conference:update', 'conference:delete',
        'skills:read', 'skills:update', 'skills:create', 'skills:delete',
        'certificate:template:read', 'certificate:template:create', 'certificate:template:update', 'certificate:template:delete',
        'certificate:issue:read'
    ],
    INSTRUCTOR: [
        'dashboard:read',
        'course:read', 'course:create', 'course:update', 'course:publish',
        'unit:read', 'unit:create', 'unit:update', 'unit:publish', 'unit:delete',
        'learning_path:read', 'learning_path:create', 'learning_path:update',
        'group:read', 'group:create', 'group:update', 'group:delete',
        'user:read',
        'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete', 'assignment:assign',
        'submission:read', 'submission:grade', 'submission:publish', 'submission:download',
        'reports:read',
        'calendar:read', 'calendar:create', 'calendar:update', 'calendar:delete',
        'conference:read', 'conference:create', 'conference:update', 'conference:delete',
        'skills:read',
        'certificate:template:read', 'certificate:issue:read'
    ],
    LEARNER: [
        'course:read',
        'unit:read',
        'learning_path:read',
        'assignment:read',
        'submission:read', 'submission:create',
        'calendar:read',
        'skills:read',
        'certificate:view_own'
    ]
};
