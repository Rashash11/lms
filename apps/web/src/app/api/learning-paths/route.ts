import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceNodeWhere } from '@/lib/auth';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import {
    validateBody,
    validateQuery,
    learningPathSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
    status: z.enum(['active', 'inactive', 'published', 'draft', 'all']).optional(),
});

/**
 * GET /api/learning-paths
 * List all learning paths with search and filtering
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'learning_path:read'
    }, async (ctx: GuardedContext) => {
        // 1. Validate query
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, listQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { search, status, sortBy, sortOrder } = query;

        // 2. Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status && status !== 'all') {
            if (status === 'active') {
                where.status = 'published';
            } else {
                where.status = status;
            }
        }

        // Apply node scope filtering
        // Custom logic: Allow seeing Global paths (branchId=null) + Node paths
        let scopedWhere = where;

        if (ctx.session.nodeId) {
            scopedWhere = {
                AND: [
                    where,
                    {
                        OR: [
                            { branchId: ctx.session.nodeId },
                            { branchId: null }
                        ]
                    }
                ]
            };
        } else {
            // Standard enforcement for users without node context
            scopedWhere = enforceNodeWhere(ctx.session, where, 'branchId');
        }

        // 3. Build orderBy
        const orderBy: any = {};
        orderBy[sortBy || 'updatedAt'] = sortOrder || 'desc';

        // 4. Fetch learning paths with course count
        const learningPaths = await prisma.learningPath.findMany({
            where: scopedWhere,
            orderBy,
            include: {
                courses: {
                    select: { id: true },
                },
            },
        });

        // Transform data
        const transformedPaths = learningPaths.map((path) => ({
            id: path.id,
            name: path.name,
            code: path.code || '',
            category: path.category || '',
            status: path.status,
            courseCount: path.courses.length,
            updatedAt: path.updatedAt,
            createdAt: path.createdAt,
        }));

        return apiResponse({ data: transformedPaths });
    });
}

/**
 * POST /api/learning-paths
 * Create a new learning path
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'learning_path:create',
        auditEvent: 'LEARNING_PATH_CHANGE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, learningPathSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { name, code, description, isSequential } = data;

        // 2. Check for duplicate code
        if (code) {
            const existing = await prisma.learningPath.findUnique({
                where: { code },
            });
            if (existing) {
                return apiError('Learning path with this code already exists', 400);
            }
        }

        // 3. Create learning path
        const learningPath = await prisma.learningPath.create({
            data: {
                name,
                code: code || null,
                description: description || null,
                status: 'inactive',
                courseOrderMode: isSequential ? 'SEQUENTIAL' : 'ANY',
                completionRule: 'ALL_COURSES_COMPLETED',
                accessRetentionEnabled: false,
            },
            include: {
                courses: true,
            },
        });

        return apiResponse(learningPath, 201);
    });
}

