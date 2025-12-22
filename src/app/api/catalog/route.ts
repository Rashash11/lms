import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET course catalog (public courses for learners to browse)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const categoryId = searchParams.get('categoryId') || '';
        const sortBy = searchParams.get('sortBy') || 'newest';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const userId = searchParams.get('userId') || ''; // For enrollment status
        const skip = (page - 1) * limit;

        // Only show published courses that aren't hidden
        const where: any = {
            status: 'PUBLISHED',
            hiddenFromCatalog: false,
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Determine sort order
        let orderBy: any = { createdAt: 'desc' };
        if (sortBy === 'title') orderBy = { title: 'asc' };
        if (sortBy === 'popular') orderBy = { createdAt: 'desc' }; // TODO: Sort by enrollment count

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    _count: { select: { enrollments: true } }
                }
            }),
            prisma.course.count({ where }),
        ]);

        // Get user's enrollments if userId provided
        let userEnrollments: any[] = [];
        if (userId) {
            const courseIds = courses.map((c: any) => c.id);
            userEnrollments = await prisma.enrollment.findMany({
                where: {
                    userId,
                    courseId: { in: courseIds }
                },
                select: { courseId: true, status: true, progress: true }
            });
        }

        const enrollmentMap = new Map(userEnrollments.map(e => [e.courseId, e]));

        const catalogCourses = courses.map((course: any) => ({
            id: course.id,
            code: course.code,
            title: course.title,
            description: course.description,
            image: course.image,
            introVideoUrl: course.introVideoUrl,
            enrollmentCount: course._count.enrollments,
            capacity: course.capacity,
            isFull: course.capacity ? course._count.enrollments >= course.capacity : false,
            // User-specific if userId provided
            isEnrolled: enrollmentMap.has(course.id),
            enrollmentStatus: enrollmentMap.get(course.id)?.status || null,
            progress: enrollmentMap.get(course.id)?.progress || 0,
        }));

        // Get categories for filtering
        const categories = await prisma.category.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({
            courses: catalogCourses,
            categories,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching catalog:', error);
        return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
    }
}
