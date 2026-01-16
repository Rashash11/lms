import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateBody, validateQuery, ValidationError } from '@/lib/validations';
import { z } from 'zod';

// Query schema
const listQuerySchema = z.object({
    status: z.enum(['PENDING', 'SUBMITTED', 'GRADED', 'RETURNED']).optional(),
});

// Create schema
const createSubmissionSchema = z.object({
    assignmentUnitId: z.string().uuid(),
    courseId: z.string().uuid(),
    content: z.string().optional(),
    fileId: z.string().uuid().optional(),
    submissionType: z.enum(['text', 'file']).optional(),
});

// Grade schema
const gradeSubmissionSchema = z.object({
    id: z.string().uuid(),
    score: z.number().min(0).max(100).optional(),
    comment: z.string().optional(),
    status: z.enum(['GRADED', 'RETURNED']).optional(),
});

/**
 * GET /api/submissions
 * List submissions for grading
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'submission:read'
    }, async (ctx: GuardedContext) => {
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, listQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const where: any = {
            status: query.status || 'PENDING'
        };

        // Role-based access
        if (ctx.session.role === 'LEARNER') {
            where.userId = ctx.session.userId;
        }

        const submissions = await prisma.assignmentSubmission.findMany({
            where,
            orderBy: { submittedAt: 'desc' },
            take: 100,
        });

        return apiResponse({ data: submissions });
    });
}

/**
 * POST /api/submissions
 * Create a submission
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'submission:create',
        auditEvent: 'SUBMISSION_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, createSubmissionSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const submission = await prisma.assignmentSubmission.create({
            data: {
                assignmentUnitId: data.assignmentUnitId,
                userId: ctx.session.userId,
                courseId: data.courseId,
                content: data.content || null,
                fileId: data.fileId || null,
                submissionType: data.submissionType || 'text',
                status: 'PENDING',
            },
        });

        return apiResponse(submission, 201);
    });
}

/**
 * PATCH /api/submissions
 * Grade a submission
 */
export async function PATCH(request: NextRequest) {
    return withGuard(request, {
        permission: 'submission:grade',
        roles: ['ADMIN', 'INSTRUCTOR', 'SUPER_INSTRUCTOR'],
        auditEvent: 'SUBMISSION_GRADED',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, gradeSubmissionSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const existing = await prisma.assignmentSubmission.findUnique({
            where: { id: data.id }
        });

        if (!existing) {
            return apiError('Submission not found', 404);
        }

        const updated = await prisma.assignmentSubmission.update({
            where: { id: data.id },
            data: {
                score: data.score ?? existing.score,
                comment: data.comment ?? existing.comment,
                status: data.status || 'GRADED',
                gradedAt: new Date(),
                gradedBy: ctx.session.userId,
            },
        });

        return apiResponse(updated);
    });
}
