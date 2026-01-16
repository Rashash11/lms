import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schemas
const updateOptionsSchema = z.object({
    isActive: z.boolean().optional(),
    code: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    completionDaysLimit: z.union([z.number(), z.string()]).nullable().optional().transform(v => v === null ? null : Number(v)),
    accessRetentionEnabled: z.boolean().optional(),
    courseOrderMode: z.enum(['SEQUENTIAL', 'ANY']).optional(),
    completionRule: z.enum(['ALL_COURSES_COMPLETED']).optional(),
    certificateType: z.enum(['CLASSIC', 'FANCY', 'MODERN', 'SIMPLE']).nullable().optional()
});

function isAbortError(error: any) {
    const msg = String(error?.message || '');
    const code = String(error?.code || '');
    return msg.toLowerCase().includes('aborted') || code === 'ECONNRESET';
}

export const dynamic = 'force-dynamic';

// GET /api/admin/learning-paths/[id]/options - Get learning path options
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'learning_path:read' }, async (ctx) => {
        const { id } = await context.params;

        // Fetch learning path with only the fields needed for options
        const learningPath = await prisma.learningPath.findUnique({
            where: { id },
            select: {
                isActive: true,
                code: true,
                category: true,
                completionDaysLimit: true,
                accessRetentionEnabled: true,
                courseOrderMode: true,
                completionRule: true,
                certificateType: true,
            },
        });

        if (!learningPath) {
            return apiError('Learning path not found', 404);
        }

        // Fetch available categories
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return apiResponse({
            options: learningPath,
            categories,
        });
    });
}

// PATCH /api/admin/learning-paths/[id]/options - Update learning path options
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'learning_path:update' }, async (ctx) => {
        const { id } = await context.params;
        const body = await request.json();

        const validation = updateOptionsSchema.safeParse(body);
        if (!validation.success) {
            return apiError('Validation failed', 400, validation.error.errors.map(e => ({ path: e.path.map(String), message: e.message })));
        }

        const data = validation.data;

        // Check if learning path exists
        const existing = await prisma.learningPath.findUnique({
            where: { id },
        });

        if (!existing) {
            return apiError('Learning path not found', 404);
        }

        // Validate code uniqueness if provided and different from current
        if (data.code && data.code !== existing.code) {
            const duplicate = await prisma.learningPath.findFirst({
                where: {
                    code: data.code,
                    id: { not: id },
                },
            });
            if (duplicate) {
                return apiError('Code already exists', 409);
            }
        }

        try {
            // Update learning path
            const updatedPath = await prisma.learningPath.update({
                where: { id },
                data: {
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
                    ...(data.code !== undefined && { code: data.code }),
                    ...(data.category !== undefined && { category: data.category }),
                    ...(data.completionDaysLimit !== undefined && { completionDaysLimit: data.completionDaysLimit }),
                    ...(data.accessRetentionEnabled !== undefined && { accessRetentionEnabled: data.accessRetentionEnabled }),
                    ...(data.courseOrderMode !== undefined && { courseOrderMode: data.courseOrderMode }),
                    ...(data.completionRule !== undefined && { completionRule: data.completionRule }),
                    ...(data.certificateType !== undefined && { certificateType: data.certificateType }),
                },
                select: {
                    isActive: true,
                    code: true,
                    category: true,
                    completionDaysLimit: true,
                    accessRetentionEnabled: true,
                    courseOrderMode: true,
                    completionRule: true,
                    certificateType: true,
                },
            });

            // Fetch categories again for consistency
            const categories = await prisma.category.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: {
                    name: 'asc',
                },
            });

            return apiResponse({
                options: updatedPath,
                categories,
            });
        } catch (error) {
            if (!isAbortError(error)) {
                logger.error('Failed to update learning path options', error);
            }
            throw error;
        }
    });
}
