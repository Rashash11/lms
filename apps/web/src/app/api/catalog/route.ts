export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateQuery, paginationSchema, ValidationError } from '@/lib/validations';
import { z } from 'zod';

// Query schema
const catalogQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    sortBy: z.enum(['newest', 'title', 'popular']).optional(),
    userId: z.string().uuid().optional(),
});

/**
 * GET /api/catalog
 * Public course catalog for learners to browse
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {
        public: true // Allow unauthenticated access
    }, async (ctx: GuardedContext) => {
        // 1. Validate query
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, catalogQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { search, sortBy, page, limit, userId } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause - only published, non-hidden courses
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

        // 3. Determine sort order
        let orderBy: any = { createdAt: 'desc' };
        if (sortBy === 'title') orderBy = { title: 'asc' };
        if (sortBy === 'popular') orderBy = { createdAt: 'desc' };

        // 4. Fetch courses
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

        // 5. Get user's enrollments if userId provided
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

        // 6. Transform for catalog display
        const catalogCourses = courses.map((course: any) => ({
            id: course.id,
            code: course.code,
            title: course.title,
            description: course.description,
            image: course.thumbnailUrl,
            introVideoUrl: course.introVideoUrl,
            enrollmentCount: course._count.enrollments,
            capacity: course.capacity,
            isFull: course.capacity ? course._count.enrollments >= course.capacity : false,
            isEnrolled: enrollmentMap.has(course.id),
            enrollmentStatus: enrollmentMap.get(course.id)?.status || null,
            progress: enrollmentMap.get(course.id)?.progress || 0,
        }));

        // 7. Get categories for filtering
        const categories = await prisma.category.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });

        return apiResponse({
            data: catalogCourses,
            categories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    });
}

