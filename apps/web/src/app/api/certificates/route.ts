import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import {
    validateBody,
    validateQuery,
    certificateSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { jobs } from '@/lib/jobs';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    userId: z.string().uuid().optional(),
});

// Extended create schema
const createCertificateSchema = certificateSchemas.issue.extend({
    templateId: z.string().uuid().optional(),
    title: z.string().min(1).optional(),
    issueDate: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
});

/**
 * GET /api/certificates
 * List certificates with filtering
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'certificate:issue:read'
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

        const { userId, page, limit } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause
        const where: any = {};
        if (userId) {
            where.userId = userId;
        }

        // 3. Fetch certificates
        const [certificates, total] = await Promise.all([
            prisma.certificateIssue.findMany({
                where,
                skip,
                take: limit,
                orderBy: { issuedAt: 'desc' },
            }),
            prisma.certificateIssue.count({ where }),
        ]);

        // Get course details
        const courseIds = certificates.map((c) => c.courseId).filter((id): id is string => Boolean(id));
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, title: true, code: true }
        });
        const courseMap = new Map(courses.map(c => [c.id, c]));

        const certificatesWithCourses = certificates.map((cert) => ({
            ...cert,
            course: cert.courseId ? courseMap.get(cert.courseId) : null,
        }));

        return apiResponse({
            data: certificatesWithCourses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    });
}

/**
 * POST /api/certificates
 * Issue a certificate
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'certificate:issue:create',
        auditEvent: 'CERTIFICATE_ISSUED',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, createCertificateSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // 2. Check course completion if courseId provided
        if (data.courseId) {
            const enrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
            });

            if (!enrollment || enrollment.status !== 'COMPLETED') {
                return apiError('User has not completed this course', 400);
            }
        }

        // 3. Resolve template
        let templateId = data.templateId;
        if (templateId) {
            const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
            if (!template) {
                templateId = undefined;
            }
        }

        if (!templateId) {
            const existingTemplate = await prisma.certificateTemplate.findFirst({
                orderBy: { createdAt: 'asc' },
            });
            if (existingTemplate) {
                templateId = existingTemplate.id;
            } else {
                const createdTemplate = await prisma.certificateTemplate.create({
                    data: {
                        name: 'Default',
                        htmlBody: '',
                        smartTags: {},
                        isSystem: true,
                    },
                });
                templateId = createdTemplate.id;
            }
        }

        // 4. Create certificate
        const certificate = await prisma.certificateIssue.create({
            data: {
                userId: data.userId,
                courseId: data.courseId,
                templateId,
                issuedAt: data.issueDate ? new Date(data.issueDate) : new Date(),
                expiresAt: data.expiryDate ? new Date(data.expiryDate) : null,
            },
        });

        // 5. Update enrollment with certificate
        if (data.courseId) {
            await prisma.enrollment.update({
                where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
                data: { certificateId: certificate.id },
            });
        }

        // 6. Queue timeline event
        jobs.timeline.addEvent({
            userId: data.userId,
            tenantId: ctx.session.tenantId,
            eventType: 'CERTIFICATE_ISSUED',
            details: { certificateId: certificate.id, courseId: data.courseId },
        }).catch(console.error);

        return apiResponse(certificate, 201);
    });
}

