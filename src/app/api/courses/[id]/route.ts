import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { z } from 'zod';

const updateCourseSchema = z.object({
    code: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    subtitle: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(), // backward compatibility if needed, but we use thumbnail_url
    thumbnail_url: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    settings: z.any().optional(),

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

// GET single course with sections and units
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!can(session, 'course:read')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: course:read' }, { status: 403 });
        }

        const course = await prisma.course.findUnique({
            where: { id: params.id },
            include: {
                sections: {
                    orderBy: { order_index: 'asc' },
                    include: {
                        units: {
                            orderBy: { order_index: 'asc' }
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
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Get units not in any section
        const unassignedUnits = await prisma.courseUnit.findMany({
            where: {
                courseId: params.id,
                sectionId: null
            },
            orderBy: { order_index: 'asc' },
        });

        return NextResponse.json({
            ...course,
            unassignedUnits,
            enrollmentCount: course._count.enrollments,
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
        const session = await requireAuth();
        if (!can(session, 'course:update_any')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: course:update_any' }, { status: 403 });
        }

        const body = await request.json();

        const validation = updateCourseSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message, details: validation.error.errors },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check unique code
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

        const updateData: any = { ...data };
        if (data.expiration) updateData.expiration = new Date(data.expiration);

        // Handle image vs thumbnail_url
        if (data.image) updateData.thumbnail_url = data.image;

        // Remove nested/extra fields not in DB Course model but possibly in body
        delete updateData.id;
        delete updateData.sections;
        delete updateData.units;
        delete updateData.unassignedUnits;
        delete updateData.image; // Using thumbnail_url now

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
        const session = await requireAuth();
        if (!can(session, 'course:delete_any')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: course:delete_any' }, { status: 403 });
        }
        // Dependencies are handled by Cascade in schema
        await prisma.course.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}

// PATCH for specific actions (publish, clone)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!can(session, 'course:update_any') && !can(session, 'course:publish')) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission to update or publish courses' }, { status: 403 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === 'publish') {
            // Get current full course state
            const course = await prisma.course.findUnique({
                where: { id: params.id },
                include: {
                    sections: {
                        include: { units: true }
                    }
                }
            });

            if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

            // Create version snapshot
            const version = await prisma.courseVersion.create({
                data: {
                    courseId: params.id,
                    versionNumber: course.version,
                    snapshot: JSON.parse(JSON.stringify(course)) // Simple deep clone
                }
            });

            // Update course status and version
            const updated = await prisma.course.update({
                where: { id: params.id },
                data: {
                    status: 'PUBLISHED',
                    version: { increment: 1 },
                    lastPublishedAt: new Date(),
                    publishedVersionId: version.id
                }
            });

            await prisma.timelineEvent.create({
                data: {
                    courseId: params.id,
                    eventType: 'COURSE_PUBLISHED',
                    details: { title: updated.title, version: version.versionNumber },
                },
            });

            return NextResponse.json(updated);
        }

        if (action === 'clone') {
            const original = await prisma.course.findUnique({
                where: { id: params.id },
                include: {
                    sections: {
                        include: { units: true }
                    }
                }
            });

            if (!original) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

            // Deep clone logic
            const cloned = await prisma.$transaction(async (tx) => {
                const newCourse = await tx.course.create({
                    data: {
                        code: `${original.code}-COPY-${Date.now()}`,
                        title: `${original.title} (Copy)`,
                        description: original.description,
                        thumbnail_url: original.thumbnail_url,
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
                            order_index: section.order_index,
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
                                order_index: unit.order_index,
                                status: 'DRAFT',
                            }
                        });
                    }
                }

                // Units not in sections
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
                            order_index: unit.order_index,
                            status: 'DRAFT',
                        }
                    });
                }

                return newCourse;
            });

            return NextResponse.json(cloned, { status: 201 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error patching course:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}
