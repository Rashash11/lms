import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCourseSchema = z.object({
    code: z.string().min(1, 'Course code is required').optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),

    // Info tab
    isActive: z.boolean().optional(),
    coachEnabled: z.boolean().optional(),
    hiddenFromCatalog: z.boolean().optional(),
    categoryId: z.string().uuid().nullable().optional().or(z.null()).or(z.undefined()),
    introVideoType: z.string().nullable().optional(),
    introVideoUrl: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    contentLocked: z.boolean().optional(),

    // Availability tab
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
    certificateTemplateId: z.string().uuid().nullable().optional().or(z.null()).or(z.undefined()),

    expiration: z.string().datetime().nullable().optional(),
}).passthrough(); // Allow extra fields from frontend

// GET all courses with pagination and filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const categoryId = searchParams.get('categoryId') || '';
        const hiddenFromCatalog = searchParams.get('hidden');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }

        if (hiddenFromCatalog !== null) {
            where.hiddenFromCatalog = hiddenFromCatalog === 'true';
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.course.count({ where }),
        ]);

        return NextResponse.json({
            courses,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

// POST create new course
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createCourseSchema.safeParse(body);
        if (!validation.success) {
            console.error('Course creation validation failed:', JSON.stringify(validation.error, null, 2));
            console.error('Received body:', JSON.stringify(body, null, 2));
            return NextResponse.json(
                { error: validation.error.errors[0].message, details: validation.error.errors },
                { status: 400 }
            );
        }


        const data = validation.data;

        // Auto-generate code if not provided
        const courseCode = data.code || `COURSE-${Date.now()}`;

        // Check if course code already exists
        const existingCourse = await prisma.course.findUnique({
            where: { code: courseCode },
        });

        if (existingCourse) {
            return NextResponse.json(
                { error: 'Course with this code already exists' },
                { status: 400 }
            );
        }

        const course = await prisma.course.create({
            data: {
                code: courseCode,
                title: data.title,
                description: data.description,
                thumbnail_url: data.image,
                status: data.status || 'DRAFT',

                // Info tab - use provided values or defaults
                isActive: data.isActive ?? false,
                coachEnabled: data.coachEnabled ?? false,
                categoryId: data.categoryId ?? null,
                introVideoType: data.introVideoType ?? null,
                introVideoUrl: data.introVideoUrl ?? null,
                price: data.price ?? null,
                contentLocked: data.contentLocked ?? false,

                // Availability tab
                hiddenFromCatalog: data.hiddenFromCatalog ?? false,
                showInCatalog: data.showInCatalog ?? true,
                capacity: data.capacity ?? null,
                publicSharingEnabled: data.publicSharingEnabled ?? false,
                enrollmentRequestEnabled: data.enrollmentRequestEnabled ?? false,

                // Limits tab
                timeLimitType: data.timeLimitType ?? null,
                timeLimit: data.timeLimit ?? null,
                accessRetentionEnabled: data.accessRetentionEnabled ?? false,
                requiredLevel: data.requiredLevel ?? null,

                // Completion tab
                unitsOrdering: data.unitsOrdering || 'sequential',
                completionRule: data.completionRule || 'all',
                scoreCalculation: data.scoreCalculation || 'all',
                certificateTemplateId: data.certificateTemplateId ?? null,

                expiration: data.expiration ? new Date(data.expiration) : null,
            },
        });

        // Log timeline event (non-blocking - don't fail course creation if this fails)
        try {
            await prisma.timelineEvent.create({
                data: {
                    courseId: course.id,
                    eventType: 'COURSE_CREATED',
                    details: { title: course.title, code: course.code },
                },
            });
        } catch (timelineError) {
            // Log the error but don't fail the course creation
            console.error('Error creating timeline event (non-critical):', timelineError);
        }

        return NextResponse.json(course, { status: 201 });
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}

// DELETE bulk delete courses
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No course IDs provided' }, { status: 400 });
        }

        // Delete group course assignments
        await prisma.groupCourse.deleteMany({
            where: { courseId: { in: ids } },
        });

        // Delete course units
        await prisma.courseUnit.deleteMany({
            where: { courseId: { in: ids } },
        });

        // Delete courses
        const result = await prisma.course.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting courses:', error);
        return NextResponse.json({ error: 'Failed to delete courses' }, { status: 500 });
    }
}

// PATCH bulk update courses (publish/unpublish/hide)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, action } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No course IDs provided' }, { status: 400 });
        }

        let updateData: any = {};

        switch (action) {
            case 'publish':
                updateData = { status: 'PUBLISHED' };
                break;
            case 'unpublish':
                updateData = { status: 'DRAFT' };
                break;
            case 'hide':
                updateData = { hiddenFromCatalog: true };
                break;
            case 'show':
                updateData = { hiddenFromCatalog: false };
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const result = await prisma.course.updateMany({
            where: { id: { in: ids } },
            data: updateData,
        });

        return NextResponse.json({ success: true, updated: result.count });
    } catch (error) {
        console.error('Error bulk updating courses:', error);
        return NextResponse.json({ error: 'Failed to update courses' }, { status: 500 });
    }
}
