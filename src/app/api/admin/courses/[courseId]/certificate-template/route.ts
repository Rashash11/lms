import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

/**
 * PATCH /api/admin/courses/[courseId]/certificate-template
 * Assigns or updates the certificate template for a course.
 * Admin/Super Instructor only.
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await requireAuth();

        // Require course:update_any permission (admin/super instructor)
        if (!(await can(session, 'course:update_any'))) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Missing permission: course:update_any' },
                { status: 403 }
            );
        }

        const { courseId } = await context.params;
        const body = await request.json();
        const { certificateTemplateId } = body;

        // Validate template exists if provided
        if (certificateTemplateId) {
            const templateExists = await prisma.certificateTemplate.findUnique({
                where: { id: certificateTemplateId }
            });

            if (!templateExists) {
                return NextResponse.json(
                    { error: 'BAD_REQUEST', message: 'Certificate template not found' },
                    { status: 400 }
                );
            }
        }

        // Update course
        const course = await prisma.course.update({
            where: { id: courseId },
            data: {
                certificateTemplateId: certificateTemplateId || null
            },
            select: {
                id: true,
                title: true,
                certificateTemplateId: true
            }
        });

        return NextResponse.json({
            success: true,
            course
        });

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Not found
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        console.error('Error updating course certificate template:', error);
        return NextResponse.json({ error: 'Failed to update certificate template' }, { status: 500 });
    }
}
