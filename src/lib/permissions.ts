import { RoleKey, SessionPayload } from "./auth";

/**
 * Check if a user has one of the required roles
 */
export function hasRole(user: SessionPayload, roles: RoleKey[]): boolean {
    return roles.includes(user.activeRole);
}

/**
 * Check if a user is an Admin
 */
export function isAdmin(user: SessionPayload): boolean {
    return user.activeRole === 'ADMIN';
}

/**
 * Check if a user is a Super Instructor
 */
export function isSuperInstructor(user: SessionPayload): boolean {
    return user.activeRole === 'SUPER_INSTRUCTOR';
}

/**
 * Check if a user is an Instructor
 */
export function isInstructor(user: SessionPayload): boolean {
    return user.activeRole === 'INSTRUCTOR';
}

/**
 * Check if a user is a Learner
 */
export function isLearner(user: SessionPayload): boolean {
    return user.activeRole === 'LEARNER';
}

/**
 * Simple permission checker based on common permission patterns
 * Maps permission strings to role checks
 */
export function can(user: SessionPayload, permission: string): boolean {
    // Admin can do everything
    if (user.activeRole === 'ADMIN') return true;

    // Super Instructor permissions
    if (user.activeRole === 'SUPER_INSTRUCTOR') {
        return [
            'course:read', 'course:create', 'course:update', 'course:update_any', 'course:publish',
            'user:read', 'user:create', 'user:update', 'user:delete',
            'assignment:read', 'assignment:create', 'assignment:update', 'assignment:delete',
            'submission:read', 'submission:grade'
        ].includes(permission);
    }

    // Instructor permissions
    if (user.activeRole === 'INSTRUCTOR') {
        return [
            'course:read', 'course:create', 'course:update', 'course:publish',
            'user:read',
            'assignment:read', 'assignment:create', 'assignment:update',
            'submission:read', 'submission:grade'
        ].includes(permission);
    }

    // Learner permissions
    if (user.activeRole === 'LEARNER') {
        return [
            'course:read',
            'assignment:read',
            'submission:create'
        ].includes(permission);
    }

    return false;
}

/**
 * Check safety constraints for user operations
 * Prevents lower-privileged users from modifying higher-privileged users
 */
export function checkSafetyConstraints(
    actor: SessionPayload,
    target: { userId: string; activeRole: RoleKey },
    action: 'update' | 'delete'
): { allowed: boolean; reason?: string } {
    // Admin can modify anyone
    if (actor.activeRole === 'ADMIN') {
        return { allowed: true };
    }

    // Super Instructor cannot modify Admins
    if (actor.activeRole === 'SUPER_INSTRUCTOR') {
        if (target.activeRole === 'ADMIN') {
            return { allowed: false, reason: 'Super Instructors cannot modify Administrator accounts' };
        }
        return { allowed: true };
    }

    // Instructors cannot modify Admins or Super Instructors
    if (actor.activeRole === 'INSTRUCTOR') {
        if (target.activeRole === 'ADMIN' || target.activeRole === 'SUPER_INSTRUCTOR') {
            return { allowed: false, reason: 'Instructors cannot modify Administrator or Super Instructor accounts' };
        }
        return { allowed: true };
    }

    // Learners cannot modify anyone
    return { allowed: false, reason: 'Learners cannot modify user accounts' };
}

// ==========================================
// COURSE PERMISSIONS
// ==========================================

export interface CourseData {
    instructorId?: string | null;
    instructors?: { userId: string }[];
}

/**
 * Check if user can manage a specific course
 * - Admin: Yes
 * - Super Instructor: Yes
 * - Instructor: Only if they are assigned to the course
 */
export function canManageCourse(user: SessionPayload, course: CourseData | null): boolean {
    if (isAdmin(user) || isSuperInstructor(user)) return true;
    if (!course || !isInstructor(user)) return false;

    // Check direct ownership
    if (course.instructorId === user.userId) return true;

    // Check if in instructors list
    if (course.instructors?.some(inst => inst.userId === user.userId)) return true;

    return false;
}

// ==========================================
// ASSIGNMENT PERMISSIONS
// ==========================================

export interface AssignmentData {
    courseId?: string | null;
    createdBy?: string;
    course?: CourseData | null;
}

/**
 * Check if user can create an assignment for a course
 */
export function canCreateAssignment(user: SessionPayload, courseId?: string): boolean {
    // Admin and Super Instructor can create anywhere
    if (isAdmin(user) || isSuperInstructor(user)) return true;

    // Instructor needs a course context, logic handled usually by canManageCourse check before calling this
    // But strictly speaking:
    if (isInstructor(user)) return true; // They can create, but should be validated against the specific course

    return false;
}

/**
 * Check if user can edit/update an assignment
 */
export function canEditAssignment(user: SessionPayload, assignment: AssignmentData): boolean {
    if (isAdmin(user) || isSuperInstructor(user)) return true;

    if (isInstructor(user)) {
        // Can edit if they manage the course
        if (assignment.course && canManageCourse(user, assignment.course)) return true;
        // Or if they created it (fallback if course link is loose)
        if (assignment.createdBy === user.userId) return true;
    }

    return false;
}

/**
 * Check if user can delete an assignment
 * - Admin: Yes
 * - Super Instructor: Yes
 * - Instructor: NO (cannot delete assignments permanently as per rules)
 */
export function canDeleteAssignment(user: SessionPayload): boolean {
    if (isAdmin(user) || isSuperInstructor(user)) return true;
    return false;
}

/**
 * Check if user can view an assignment
 * - Admin/Super/Instructor: Yes (Instructor usually restricted by course, but generally can view if they have access)
 * - Learner: Yes (if enrolled - typically checked at data fetching level)
 */
export function canViewAssignment(user: SessionPayload): boolean {
    return true; // Basic check, data filtering handles the rest
}

// ==========================================
// SUBMISSION PERMISSIONS
// ==========================================

/**
 * Check if user can submit an assignment
 */
export function canSubmitAssignment(user: SessionPayload): boolean {
    return isLearner(user);
}

/**
 * Check if user can grade a submission
 */
export function canGradeSubmission(user: SessionPayload, course: CourseData): boolean {
    return canManageCourse(user, course);
}

/**
 * Check if user can view a submission
 * - Learner: Only their own
 * - Admin/Super/Instructor: Yes (Instructor if managing course)
 */
export function canViewSubmission(user: SessionPayload, submissionUserId: string, course: CourseData): boolean {
    if (user.userId === submissionUserId) return true; // Own submission

    // Others must have management rights
    if (canManageCourse(user, course)) return true;

    return false;
}
