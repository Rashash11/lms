import { prisma } from '@/lib/prisma';

export interface OverviewStats {
    activeUsers: number;
    neverLoggedIn: number;
    assignedCourses: number;
    completedCourses: number;
}

export interface LearningStructure {
    courses: number;
    categories: number;
    branches: number;
    groups: number;
    learningPaths: number;
}

export interface ActivityData {
    labels: string[];
    logins: number[];
    completions: number[];
}

/**
 * Get active users count (users who have logged in at least once)
 */
export async function getActiveUsersCount(): Promise<number> {
    return await prisma.user.count({
        where: {
            lastLoginAt: { not: null },
            status: 'ACTIVE',
        },
    });
}

/**
 * Get never logged in users count
 */
export async function getNeverLoggedInCount(): Promise<number> {
    return await prisma.user.count({
        where: {
            lastLoginAt: null,
        },
    });
}

/**
 * Get total assigned courses count (unique enrollments)
 */
export async function getAssignedCoursesCount(): Promise<number> {
    return await prisma.enrollment.count();
}

/**
 * Get completed courses count
 */
export async function getCompletedCoursesCount(): Promise<number> {
    return await prisma.enrollment.count({
        where: {
            status: 'COMPLETED',
        },
    });
}

/**
 * Get overview statistics
 */
export async function getOverviewStats(): Promise<OverviewStats> {
    const [activeUsers, neverLoggedIn, assignedCourses, completedCourses] = await Promise.all([
        getActiveUsersCount(),
        getNeverLoggedInCount(),
        getAssignedCoursesCount(),
        getCompletedCoursesCount(),
    ]);

    return {
        activeUsers,
        neverLoggedIn,
        assignedCourses,
        completedCourses,
    };
}

/**
 * Get learning structure counts
 */
export async function getLearningStructureCounts(): Promise<LearningStructure> {
    const [courses, categories, branches, groups, learningPaths] = await Promise.all([
        prisma.course.count(),
        prisma.category.count(),
        prisma.branch.count(),
        prisma.group.count(),
        prisma.learningPath.count(),
    ]);

    return {
        courses,
        categories,
        branches,
        groups,
        learningPaths,
    };
}

/**
 * Get activity data for chart
 * @param period 'month' | 'week' | 'day'
 */
export async function getActivityData(period: 'month' | 'week' | 'day' = 'month'): Promise<ActivityData> {
    const now = new Date();
    const labels: string[] = [];
    const logins: number[] = [];
    const completions: number[] = [];

    let startDate: Date;
    let dateFormat: Intl.DateTimeFormatOptions;
    let groupBy: string;

    if (period === 'month') {
        // Last 30 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        dateFormat = { month: 'short', day: 'numeric' };
        groupBy = 'day';
    } else if (period === 'week') {
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        dateFormat = { weekday: 'short' };
        groupBy = 'day';
    } else {
        // Last 24 hours
        startDate = new Date(now);
        startDate.setHours(now.getHours() - 24);
        dateFormat = { hour: 'numeric' };
        groupBy = 'hour';
    }

    // Get login data
    const loginData = await prisma.user.groupBy({
        by: ['lastLoginAt'],
        where: {
            lastLoginAt: {
                gte: startDate,
            },
        },
        _count: true,
    });

    // Get completion data
    const completionData = await prisma.enrollment.groupBy({
        by: ['completedAt'],
        where: {
            completedAt: {
                gte: startDate,
                not: null,
            },
        },
        _count: true,
    });

    // Generate labels based on period
    const daysCount = period === 'month' ? 30 : period === 'week' ? 7 : 24;
    for (let i = daysCount - 1; i >= 0; i--) {
        const date = new Date(now);
        if (period === 'day') {
            date.setHours(now.getHours() - i);
        } else {
            date.setDate(now.getDate() - i);
        }
        labels.push(date.toLocaleDateString('en-US', dateFormat));
        logins.push(0);
        completions.push(0);
    }

    // This is a simplified version - in production you'd need proper date grouping
    // For now, return sample data structure
    return {
        labels,
        logins,
        completions,
    };
}
