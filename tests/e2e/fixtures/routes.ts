/**
 * Route Fixtures
 * 
 * Maps dynamic routes to seeded entity IDs for testing.
 */

import * as fs from 'fs';
import * as path from 'path';

const fixturesPath = path.join(__dirname, 'seed.json');

interface SeedFixtures {
    courseAId: string;
    courseBId: string;
    lpAId: string;
    assignmentAId: string;
    submissionAId: string;
    skillAId: string;
    conferenceAId: string;
    unitVideoId: string;
    learnerAId: string;
    groupAId: string;
    categoryAId: string;
    nodeAId: string;
    nodeBId: string;
}

let _fixtures: SeedFixtures | null = null;

export function getFixtures(): SeedFixtures {
    if (!_fixtures) {
        if (!fs.existsSync(fixturesPath)) {
            throw new Error(`Seed fixtures not found. Run 'npm run test:setup' first.`);
        }
        _fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
    }
    return _fixtures!;
}

/**
 * Dynamic route mappings per role
 */
export function getDynamicRoutes() {
    const f = getFixtures();

    return {
        // Admin routes with dynamic IDs
        admin: {
            courseDetail: `/admin/courses/${f.courseAId}`,
            learningPathEdit: `/admin/learning-paths/${f.lpAId}/edit`,
            branchEdit: `/admin/branches/${f.nodeAId}/edit`,
        },

        // Instructor routes
        instructor: {
            courseDetail: `/instructor/courses/${f.courseAId}`,
            skillDetail: `/instructor/skills/${f.skillAId}`,
        },

        // Super Instructor routes
        superInstructor: {
            gradingDetail: `/super-instructor/grading-hub/${f.submissionAId}`,
            learningPathEdit: `/super-instructor/learning-paths/${f.lpAId}/edit`,
        },

        // Learner routes
        learner: {
            courseDetail: `/learner/courses/${f.courseAId}`,
            assignmentDetail: `/learner/assignments/${f.assignmentAId}`,
            unitDetail: `/learner/courses/${f.courseAId}/units/${f.unitVideoId}`,
        },

        // Routes for negative tests (cross-node access)
        crossNode: {
            courseBDetail: `/learner/courses/${f.courseBId}`,
        },
    };
}

/**
 * All static routes per role for smoke testing
 */
export const staticRoutes = {
    public: [
        '/',
        '/login',
        '/signup',
        '/forgot-password',
        '/theme-preview',
    ],

    superadmin: [
        '/superadmin',
        '/superadmin/system-health',
        '/superadmin/tenants',
    ],

    admin: [
        '/admin',
        '/admin/users',
        '/admin/courses',
        '/admin/learning-paths',
        '/admin/groups',
        '/admin/branches',
        '/admin/assignments',
        '/admin/skills',
        '/admin/reports',
        '/admin/notifications',
        '/admin/automations',
        '/admin/settings',
        '/admin/security/sessions',
        '/admin/security/audit',
        '/admin/course-store',
        '/admin/discussions',
        '/admin/files',
        '/admin/gamification',
        '/admin/subscription',
    ],

    superInstructor: [
        '/super-instructor',
        '/super-instructor/users',
        '/super-instructor/courses',
        '/super-instructor/learning-paths',
        '/super-instructor/assignments',
        '/super-instructor/groups',
        '/super-instructor/grading-hub',
        '/super-instructor/conferences',
        '/super-instructor/reports',
        '/super-instructor/calendar',
        '/super-instructor/skills',
    ],

    instructor: [
        '/instructor',
        '/instructor/courses',
        '/instructor/learning-paths',
        '/instructor/assignments',
        '/instructor/grading-hub',
        '/instructor/groups',
        '/instructor/conferences',
        '/instructor/calendar',
        '/instructor/reports',
        '/instructor/skills',
        '/instructor/discussions',
        '/instructor/ilt',
        '/instructor/grading',
        '/instructor/learners',
        '/instructor/messages',
    ],

    learner: [
        '/learner',
        '/learner/courses',
        '/learner/catalog',
        '/learner/assignments',
        '/learner/certificates',
        '/learner/ilt',
        '/learner/achievements',
        '/learner/discussions',
        '/learner/leaderboard',
        '/learner/messages',
    ],

    candidate: [
        '/candidate',
        '/candidate/onboarding',
        '/candidate/profile',
        '/candidate/exams',
        '/candidate/history',
        '/candidate/help',
    ],

    dashboard: [
        '/dashboard',
        '/courses',
        '/courses/new',
        '/candidates',
        '/candidates/report',
        '/users',
    ],
};

/**
 * Routes that should be forbidden for each role
 */
export const forbiddenRoutes = {
    learner: [
        '/admin',
        '/admin/users',
        '/instructor',
        '/super-instructor',
        '/superadmin',
    ],

    instructor: [
        '/admin/settings',
        '/admin/security/audit',
        '/admin/automations',
        '/superadmin',
    ],

    superInstructor: [
        '/admin/settings',
        '/admin/security/audit',
        '/superadmin',
    ],

    candidate: [
        '/admin',
        '/instructor',
        '/super-instructor',
        '/superadmin',
        '/learner',
    ],
};
