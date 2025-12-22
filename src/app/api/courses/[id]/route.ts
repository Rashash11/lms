import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCourseSchema = z.object({
    code: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),

    // Info tab
    isActive: z.boolean().optional(),
    coachEnabled: z.boolean().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    introVideoType: z.string().nullable().optional(),
    introVideoUrl: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    contentLocked: z.boolean().optional(),

    // Availability tab
    hiddenFromCatalog: z.boolean().optional(),
    showInCatalog: z.boolean().optional(),
    capacity: z.number().int().nonnegative().nullable().optional(),
    publicSharingEnabled: z.boolean().optional(),
    enrollmentRequestEnabled: z.boolean().optional(),

    // Limits tab
    timeLimitType: z.string().nullable().optional(),
    timeLimit: z.number().int().nonnegative().nullable().optional(),
    accessRetentionEnabled: z.boolean().optional(),
    requiredLevel: z.number().int().nullable().optional(),

    // Completion tab
    unitsOrdering: z.enum(['sequential', 'any']).optional(),
    completionRule: z.enum(['all', 'any']).optional(),
    scoreCalculation: z.enum(['all', 'tests', 'assignments']).optional(),
    certificateTemplateId: z.string().uuid().nullable().optional(),

    expiration: z.string().datetime().nullable().optional(),
}).passthrough(); // Allow extra fields from frontend

// GET single course with units
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const course = await prisma.course.findUnique({
            where: { id: params.id },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Get course units
        const units = await prisma.courseUnit.findMany({
            where: { courseId: params.id },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({
            ...course,
            units,
            unitCount: units.length,
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}

// PUT update course
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = updateCourseSchema.safeParse(body);
        if (!validation.success) {
            console.error('Course update validation failed:', JSON.stringify(validation.error, null, 2));
            console.error('Received body:', JSON.stringify(body, null, 2));
            return NextResponse.json(
                { error: validation.error.errors[0].message, details: validation.error.errors },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if code is unique (if changing)
        if (data.code) {
            const existingCourse = await prisma.course.findFirst({
                where: {
                    code: data.code,
                    id: { not: params.id },
                },
            });
            if (existingCourse) {
                return NextResponse.json(
                    { error: 'Course code already in use' },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};
        if (data.code !== undefined) updateData.code = data.code;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.status !== undefined) updateData.status = data.status;

        // Info tab
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.coachEnabled !== undefined) updateData.coachEnabled = data.coachEnabled;
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
        if (data.introVideoType !== undefined) updateData.introVideoType = data.introVideoType;
        if (data.introVideoUrl !== undefined) updateData.introVideoUrl = data.introVideoUrl;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.contentLocked !== undefined) updateData.contentLocked = data.contentLocked;

        // Availability tab
        if (data.hiddenFromCatalog !== undefined) updateData.hiddenFromCatalog = data.hiddenFromCatalog;
        if (data.showInCatalog !== undefined) updateData.showInCatalog = data.showInCatalog;
        if (data.capacity !== undefined) updateData.capacity = data.capacity;
        if (data.publicSharingEnabled !== undefined) updateData.publicSharingEnabled = data.publicSharingEnabled;
        if (data.enrollmentRequestEnabled !== undefined) updateData.enrollmentRequestEnabled = data.enrollmentRequestEnabled;

        // Limits tab
        if (data.timeLimitType !== undefined) updateData.timeLimitType = data.timeLimitType;
        if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit;
        if (data.accessRetentionEnabled !== undefined) updateData.accessRetentionEnabled = data.accessRetentionEnabled;
        if (data.requiredLevel !== undefined) updateData.requiredLevel = data.requiredLevel;

        // Completion tab
        if (data.unitsOrdering !== undefined) updateData.unitsOrdering = data.unitsOrdering;
        if (data.completionRule !== undefined) updateData.completionRule = data.completionRule;
        if (data.scoreCalculation !== undefined) updateData.scoreCalculation = data.scoreCalculation;
        if (data.certificateTemplateId !== undefined) updateData.certificateTemplateId = data.certificateTemplateId;

        if (data.expiration !== undefined) updateData.expiration = data.expiration ? new Date(data.expiration) : null;

        const course = await prisma.course.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error updating course:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}

// DELETE course
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Delete units
        await prisma.courseUnit.deleteMany({
            where: { courseId: params.id },
        });

        // Delete group assignments
        await prisma.groupCourse.deleteMany({
            where: { courseId: params.id },
        });

        // Delete course
        await prisma.course.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}

// PATCH for specific actions (publish, clone, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'publish') {
            const course = await prisma.course.update({
                where: { id: params.id },
                data: { status: 'PUBLISHED' },
            });

            await prisma.timelineEvent.create({
                data: {
                    courseId: params.id,
                    eventType: 'COURSE_PUBLISHED',
                    details: { title: course.title },
                },
            });

            return NextResponse.json(course);
        }

        if (action === 'unpublish') {
            const course = await prisma.course.update({
                where: { id: params.id },
                data: { status: 'DRAFT' },
            });
            return NextResponse.json(course);
        }

        if (action === 'clone') {
            const original = await prisma.course.findUnique({
                where: { id: params.id },
            });

            if (!original) {
                return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            }

            const cloned = await prisma.course.create({
                data: {
                    code: `${original.code}-COPY-${Date.now()}`,
                    title: `${original.title} (Copy)`,
                    description: original.description,
                    image: original.image,
                    status: 'DRAFT',
                    hiddenFromCatalog: true,
                    introVideoType: original.introVideoType,
                    introVideoUrl: original.introVideoUrl,
                    capacity: original.capacity,
                    timeLimit: original.timeLimit,
                },
            });

            return NextResponse.json(cloned, { status: 201 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error patching course:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}
