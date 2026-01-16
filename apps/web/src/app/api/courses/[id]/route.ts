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
    courseSchemas,
    ValidationError
} from '@/lib/validations';
import { jobs } from '@/lib/jobs';
import { z } from 'zod';

// Extended update schema for course detail
const updateCourseSchema = courseSchemas.update.extend({
    subtitle: z.string().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    image: z.string().nullable().optional(), // backward compatibility
    settings: z.any().optional(),
    isActive: z.boolean().optional(),
    coachEnabled: z.boolean().optional(),
    introVideoType: z.string().nullable().optional(),
    introVideoUrl: z.string().nullable().optional(),
    contentLocked: z.boolean().optional(),
    publicSharingEnabled: z.boolean().optional(),
    accessRetentionEnabled: z.boolean().optional(),
    requiredLevel: z.number().int().nullable().optional(),
    unitsOrdering: z.enum(['sequential', 'any']).optional(),
    expiration: z.string().datetime().nullable().optional(),
}).passthrough();

/**
 * GET /api/courses/[id]
 * Get single course with sections and units
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;

    return withGuard(request, {
        permission: 'course:read'
    }, async (ctx: GuardedContext) => {
        const where: any = { id: courseId };

        if (ctx.session.role === 'LEARNER') {
            where.enrollments = {
                some: { userId: ctx.session.userId }
            };
        }

        if (ctx.session.role === 'INSTRUCTOR') {
            where.OR = [
                { instructorId: ctx.session.userId },
                { instructors: { some: { instructorId: ctx.session.userId } } },
            ];
        }

        const course = await prisma.course.findFirst({
            where,
            include: {
                sections: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        units: {
                            orderBy: { orderIndex: 'asc' }
                        }
                    }
                },
                files: {
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        if (!course) {
            return apiError('Course not found', 404);
        }

        // Get units not in any section
        const unassignedUnits = await prisma.courseUnit.findMany({
            where: {
                courseId,
                sectionId: null
            },
            orderBy: { orderIndex: 'asc' },
        });

        return apiResponse({
            ...course,
            unassignedUnits,
            enrollmentCount: course._count.enrollments,
        });
    });
}

/**
 * PUT /api/courses/[id]
 * Update course details
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;

    return withGuard(request, {
        permission: 'course:update',
        auditEvent: 'COURSE_UPDATE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, updateCourseSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // 2. Check unique code if being changed
        if (data.code) {
            const existingCourse = await prisma.course.findFirst({
                where: {
                    code: data.code,
                    id: { not: courseId },
                },
            });
            if (existingCourse) {
                return apiError('Course code already in use', 400);
            }
        }

        // 3. Build update data
        const updateData: any = { ...data };
        if (data.expiration) updateData.expiration = new Date(data.expiration);
        if (data.image) updateData.thumbnailUrl = data.image;

        // Remove fields not in DB model
        delete updateData.id;
        delete updateData.sections;
        delete updateData.units;
        delete updateData.unassignedUnits;
        delete updateData.image;

        // 4. Update course
        // First check existence to ensure 404 if not found/owned
        const existing = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true }
        });
        if (!existing) {
            return apiError('Course not found', 404);
        }

        const course = await prisma.course.update({
            where: { id: courseId },
            data: updateData,
        });

        return apiResponse(course);
    });
}

/**
 * DELETE /api/courses/[id]
 * Delete a course (soft delete via Prisma middleware)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;

    return withGuard(request, {
        permission: 'course:delete',
        auditEvent: 'COURSE_DELETE',
    }, async (ctx: GuardedContext) => {
        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, title: true },
        });

        if (!course) {
            return apiError('Course not found', 404);
        }

        // Soft delete handled by Prisma middleware
        await prisma.course.delete({
            where: { id: courseId },
        });

        return apiResponse({ success: true });
    });
}

/**
 * PATCH /api/courses/[id]
 * Specific actions: publish, clone
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;

    return withGuard(request, {
        permissions: ['course:update', 'course:publish'],
        auditEvent: 'COURSE_UPDATE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { action } = body;

        if (action === 'publish') {
            return handlePublish(courseId, ctx);
        }

        if (action === 'clone') {
            return handleClone(courseId, ctx);
        }

        return apiError('Invalid action', 400);
    });
}

/**
 * Publish course - creates version snapshot
 */
async function handlePublish(courseId: string, ctx: GuardedContext) {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            sections: {
                include: { units: true }
            }
        }
    });

    if (!course) {
        return apiError('Course not found', 404);
    }

    // Create version snapshot
    const version = await prisma.courseVersion.create({
        data: {
            courseId,
            versionNumber: course.version,
            snapshot: JSON.parse(JSON.stringify(course))
        }
    });

    // Update course
    const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
            status: 'PUBLISHED',
            version: { increment: 1 },
            lastPublishedAt: new Date(),
            publishedVersionId: version.id
        }
    });

    // Queue timeline event
    jobs.timeline.addEvent({
        userId: ctx.session.userId,
        tenantId: ctx.session.tenantId,
        eventType: 'COURSE_PUBLISHED',
        courseId,
        details: { title: updated.title, version: version.versionNumber },
    }).catch(console.error);

    return apiResponse(updated);
}

/**
 * Clone course - deep copy with sections and units
 */
async function handleClone(courseId: string, ctx: GuardedContext) {
    const original = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            sections: {
                include: { units: true }
            }
        }
    });

    if (!original) {
        return apiError('Course not found', 404);
    }

    const cloned = await prisma.$transaction(async (tx) => {
        const newCourse = await tx.course.create({
            data: {
                code: `${original.code}-COPY-${Date.now()}`,
                title: `${original.title} (Copy)`,
                description: original.description,
                thumbnailUrl: original.thumbnailUrl,
                status: 'DRAFT',
                isActive: original.isActive,
                categoryId: original.categoryId,
                introVideoType: original.introVideoType,
                introVideoUrl: original.introVideoUrl,
                price: original.price,
                unitsOrdering: original.unitsOrdering,
                completionRule: original.completionRule,
                scoreCalculation: original.scoreCalculation,
                settings: original.settings as any,
            }
        });

        // Clone sections and units
        for (const section of original.sections) {
            const newSection = await tx.courseSection.create({
                data: {
                    courseId: newCourse.id,
                    title: section.title,
                    orderIndex: section.orderIndex,
                    dripEnabled: section.dripEnabled,
                    dripType: section.dripType,
                    dripValue: section.dripValue,
                }
            });

            for (const unit of section.units) {
                await tx.courseUnit.create({
                    data: {
                        courseId: newCourse.id,
                        sectionId: newSection.id,
                        type: unit.type,
                        title: unit.title,
                        config: unit.config as any,
                        orderIndex: unit.orderIndex,
                        status: 'DRAFT',
                    }
                });
            }
        }

        // Clone unassigned units
        const unassigned = await tx.courseUnit.findMany({
            where: { courseId: original.id, sectionId: null }
        });

        for (const unit of unassigned) {
            await tx.courseUnit.create({
                data: {
                    courseId: newCourse.id,
                    type: unit.type,
                    title: unit.title,
                    config: unit.config as any,
                    orderIndex: unit.orderIndex,
                    status: 'DRAFT',
                }
            });
        }

        return newCourse;
    });

    // Queue timeline event
    jobs.timeline.addEvent({
        userId: ctx.session.userId,
        tenantId: ctx.session.tenantId,
        eventType: 'COURSE_CREATED',
        courseId: cloned.id,
        details: { title: cloned.title, clonedFrom: original.id },
    }).catch(console.error);

    return apiResponse(cloned, 201);
}

