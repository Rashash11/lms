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

export interface EnrollmentDistribution {
    completed: number;
    inProgress: number;
    notStarted: number;
}

export interface TopCourse {
    name: string;
    enrollments: number;
}

export interface UserEngagement {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    avgCompletionDays: number;
    certificatesIssued: number;
}

export interface BranchStat {
    name: string;
    users: number;
    completions: number;
}

export interface LearningPathProgress {
    total: number;
    completed: number;
    inProgress: number;
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
 * Get enrollment distribution for pie chart
 */
export async function getEnrollmentDistribution(): Promise<EnrollmentDistribution> {
    const [completed, inProgress, notStarted] = await Promise.all([
        prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
        prisma.enrollment.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.enrollment.count({ where: { status: 'NOT_STARTED' } }),
    ]);
    return { completed, inProgress, notStarted };
}

/**
 * Get top courses by enrollment count
 */
export async function getTopCoursesByEnrollment(limit = 10): Promise<TopCourse[]> {
    const courses = await prisma.course.findMany({
        select: {
            title: true,
            _count: { select: { enrollments: true } },
        },
        orderBy: { enrollments: { _count: 'desc' } },
        take: limit,
    });
    return courses.map(c => ({ name: c.title, enrollments: c._count.enrollments }));
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagementMetrics(): Promise<UserEngagement> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [dailyActiveUsers, weeklyActiveUsers, certificatesIssued] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { gte: oneDayAgo } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: oneWeekAgo } } }),
        prisma.certificateIssue.count().catch(() => 0),
    ]);

    // Calculate average completion days from completed enrollments
    const completedEnrollments = await prisma.enrollment.findMany({
        where: { status: 'COMPLETED', completedAt: { not: null }, startedAt: { not: null } },
        select: { startedAt: true, completedAt: true },
        take: 100,
    });

    let avgCompletionDays = 14; // default
    if (completedEnrollments.length > 0) {
        const totalDays = completedEnrollments.reduce((sum, e) => {
            if (e.startedAt && e.completedAt) {
                return sum + (e.completedAt.getTime() - e.startedAt.getTime()) / (1000 * 60 * 60 * 24);
            }
            return sum;
        }, 0);
        avgCompletionDays = Math.round(totalDays / completedEnrollments.length);
    }

    return { dailyActiveUsers, weeklyActiveUsers, avgCompletionDays, certificatesIssued };
}

/**
 * Get branch statistics
 */
export async function getBranchStats(): Promise<BranchStat[]> {
    const branches = await prisma.branch.findMany({
        select: {
            name: true,
            _count: { select: { users: true } },
        },
    });

    // Get completion counts per branch (via users)
    const branchStats = await Promise.all(
        branches.map(async (branch) => {
            const completions = await prisma.enrollment.count({
                where: {
                    status: 'COMPLETED',
                    user: { node: { name: branch.name } },
                },
            }).catch(() => 0);

            return {
                name: branch.name,
                users: branch._count.users,
                completions,
            };
        })
    );

    return branchStats;
}

/**
 * Get learning path progress summary
 */
export async function getLearningPathProgress(): Promise<LearningPathProgress> {
    const [total, completed, inProgress] = await Promise.all([
        prisma.learningPathEnrollment.count(),
        prisma.learningPathEnrollment.count({ where: { status: 'COMPLETED' } }),
        prisma.learningPathEnrollment.count({ where: { status: 'IN_PROGRESS' } }),
    ]);
    return { total, completed, inProgress };
}

/**
 * Get activity data for chart - using timeline events
 * @param period 'month' | 'week' | 'day'
 */
export async function getActivityData(period: 'month' | 'week' | 'day' = 'month'): Promise<ActivityData> {
    const now = new Date();
    const labels: string[] = [];
    const logins: number[] = [];
    const completions: number[] = [];

    let startDate: Date;
    let dateFormat: Intl.DateTimeFormatOptions;
    let daysCount: number;

    if (period === 'month') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        dateFormat = { month: 'short', day: 'numeric' };
        daysCount = 30;
    } else if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        dateFormat = { weekday: 'short' };
        daysCount = 7;
    } else {
        startDate = new Date(now);
        startDate.setHours(now.getHours() - 24);
        dateFormat = { hour: 'numeric' };
        daysCount = 24;
    }

    // Get timeline events for activity data
    const events = await prisma.timelineEvent.findMany({
        where: {
            timestamp: { gte: startDate },
        },
        select: {
            timestamp: true,
            eventType: true,
        },
    });

    // Generate date buckets
    const dateBuckets: Map<string, { logins: number; completions: number }> = new Map();

    for (let i = daysCount - 1; i >= 0; i--) {
        const date = new Date(now);
        if (period === 'day') {
            date.setHours(now.getHours() - i, 0, 0, 0);
        } else {
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0);
        }
        const label = date.toLocaleDateString('en-US', dateFormat);
        labels.push(label);
        dateBuckets.set(label, { logins: 0, completions: 0 });
    }

    // Aggregate events into buckets
    for (const event of events) {
        const eventDate = new Date(event.timestamp);
        const label = eventDate.toLocaleDateString('en-US', dateFormat);
        const bucket = dateBuckets.get(label);
        if (bucket) {
            if (event.eventType === 'USER_LOGIN') {
                bucket.logins++;
            } else if (event.eventType === 'COURSE_COMPLETED') {
                bucket.completions++;
            }
        }
    }

    // Convert buckets to arrays
    for (const label of labels) {
        const bucket = dateBuckets.get(label)!;
        logins.push(bucket.logins);
        completions.push(bucket.completions);
    }

    return {
        labels,
        logins,
        completions,
    };
}

