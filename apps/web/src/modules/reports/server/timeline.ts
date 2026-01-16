import { prisma } from '@/lib/prisma';

export interface TimelineFilters {
    from?: Date;
    to?: Date;
    eventType?: string;
    userId?: string;
    courseId?: string;
}

export interface TimelineEventItem {
    id: string;
    timestamp: Date;
    relativeTime: string;
    eventType: string;
    description: string;
    userId?: string;
    userName?: string;
    courseId?: string;
    courseName?: string;
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

/**
 * Get timeline events with filters
 */
export async function getTimelineEvents(filters?: TimelineFilters): Promise<TimelineEventItem[]> {
    const where: any = {};

    if (filters?.from || filters?.to) {
        where.timestamp = {};
        if (filters.from) {
            where.timestamp.gte = filters.from;
        }
        if (filters.to) {
            where.timestamp.lte = filters.to;
        }
    }

    if (filters?.eventType) {
        where.eventType = filters.eventType;
    }

    if (filters?.userId) {
        where.userId = filters.userId;
    }

    if (filters?.courseId) {
        where.courseId = filters.courseId;
    }

    const events = await prisma.timelineEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100,
    });

    // Get user and course details for events
    const userIds = [...new Set(events.map((e) => e.userId).filter(Boolean))];
    const courseIds = [...new Set(events.map((e) => e.courseId).filter(Boolean))];

    const [users, courses] = await Promise.all([
        userIds.length > 0
            ? prisma.user.findMany({
                where: { id: { in: userIds as string[] } },
                select: { id: true, firstName: true, lastName: true },
            })
            : [],
        courseIds.length > 0
            ? prisma.course.findMany({
                where: { id: { in: courseIds as string[] } },
                select: { id: true, title: true },
            })
            : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`] as [string, string]));
    const courseMap = new Map(courses.map((c) => [c.id, c.title] as [string, string]));

    return events.map((event) => {
        const details = event.details as any;
        let description = '';

        // Build description based on event type
        switch (event.eventType) {
            case 'user_signin':
                description = 'You signed in';
                break;
            case 'learning_path_created':
                description = `You created the learning path ${details?.name || 'New learning path'}`;
                break;
            case 'course_created':
                description = `You created the course ${details?.name || 'New course'}`;
                break;
            case 'user_created':
                description = `User ${details?.userName || 'New user'} was created`;
                break;
            case 'course_completed':
                description = `You completed the course ${courseMap.get(event.courseId!) || 'Course'}`;
                break;
            default:
                description = event.eventType.replace(/_/g, ' ');
        }

        return {
            id: event.id,
            timestamp: event.timestamp,
            relativeTime: formatRelativeTime(event.timestamp),
            eventType: event.eventType,
            description,
            userId: event.userId || undefined,
            userName: event.userId ? userMap.get(event.userId) : undefined,
            courseId: event.courseId || undefined,
            courseName: event.courseId ? courseMap.get(event.courseId) : undefined,
        };
    });
}
