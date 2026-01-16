import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    GuardedContext
} from '@/lib/api-guard';
import { validateQuery, ValidationError } from '@/lib/validations';
import { z } from 'zod';

// Query schema
const reportQuerySchema = z.object({
    type: z.enum(['overview', 'user-progress', 'course-analytics', 'completion']).optional(),
});

/**
 * GET /api/reports
 * Get report data and analytics
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'reports:read'
    }, async (ctx: GuardedContext) => {
        // 1. Validate query
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, reportQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiResponse({ stats: {}, data: [] });
            }
            throw e;
        }

        const type = query.type || 'overview';

        // 2. Fetch basic analytics
        let totalUsers = 0;
        let totalCourses = 0;
        let completedEnrollments = 0;
        let totalEnrollments = 0;

        try {
            [totalUsers, totalCourses, completedEnrollments, totalEnrollments] = await Promise.all([
                prisma.user.count(),
                prisma.course.count(),
                prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
                prisma.enrollment.count(),
            ]);
        } catch {
            console.warn('Some counts failed, using defaults');
        }

        const completionRate = totalEnrollments > 0
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0;

        const stats = {
            totalUsers,
            totalCourses,
            completionRate: `${completionRate}%`,
            activeLearners: totalUsers,
        };

        // 3. Return type-specific data
        if (type === 'user-progress') {
            try {
                const enrollments = await prisma.enrollment.findMany({
                    take: 50,
                    orderBy: { updatedAt: 'desc' },
                });
                return apiResponse({ stats, data: enrollments });
            } catch {
                return apiResponse({ stats, data: [] });
            }
        }

        return apiResponse({ stats, data: [] });
    });
}

