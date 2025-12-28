import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET learner's enrolled courses (My Courses)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let userId = searchParams.get('userId');
        const status = searchParams.get('status') || '';
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        if (!userId) {
            const session = await getSession();
            if (session) {
                userId = session.userId;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const where: any = { userId };

        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        if (search) {
            where.course = {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ]
            };
        }

        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    course: {
                        select: {
                            id: true,
                            code: true,
                            title: true,
                            description: true,
                            thumbnail_url: true,
                            status: true,
                        }
                    }
                }
            }),
            prisma.enrollment.count({ where }),
        ]);

        // Calculate stats
        const stats = await prisma.enrollment.groupBy({
            by: ['status'],
            where: { userId },
            _count: { id: true },
        });

        const statsMap: any = {
            total: 0,
            inProgress: 0,
            completed: 0,
            notStarted: 0,
        };

        stats.forEach((s: any) => {
            statsMap.total += s._count.id;
            if (s.status === 'IN_PROGRESS') statsMap.inProgress = s._count.id;
            if (s.status === 'COMPLETED') statsMap.completed = s._count.id;
            if (s.status === 'NOT_STARTED') statsMap.notStarted = s._count.id;
        });

        return NextResponse.json({
            enrollments,
            stats: statsMap,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
}

// POST enroll user in course
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, courseId } = body;

        if (!userId || !courseId) {
            return NextResponse.json(
                { error: 'userId and courseId are required' },
                { status: 400 }
            );
        }

        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (course.status !== 'PUBLISHED') {
            return NextResponse.json(
                { error: 'Cannot enroll in unpublished course' },
                { status: 400 }
            );
        }

        // Check capacity
        if (course.capacity) {
            const enrollmentCount = await prisma.enrollment.count({
                where: { courseId },
            });
            if (enrollmentCount >= course.capacity) {
                return NextResponse.json(
                    { error: 'Course is at full capacity' },
                    { status: 400 }
                );
            }
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Already enrolled in this course' },
                { status: 400 }
            );
        }

        // Calculate expiration if course has time limit
        let expiresAt = null;
        if (course.expiration) {
            expiresAt = course.expiration;
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: 'NOT_STARTED',
                expiresAt,
            },
            include: { course: true },
        });

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId,
                courseId,
                eventType: 'COURSE_ENROLLED',
                details: { courseTitle: course.title },
            },
        });

        return NextResponse.json(enrollment, { status: 201 });
    } catch (error) {
        console.error('Error creating enrollment:', error);
        return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }
}
