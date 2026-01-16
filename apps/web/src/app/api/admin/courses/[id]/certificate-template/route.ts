import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';
import { z } from 'zod';

// Validation schemas
const updateCertificateSchema = z.object({
    certificateTemplateId: z.string().nullable().optional()
});

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/courses/[courseId]/certificate-template
 * Assigns or updates the certificate template for a course.
 * Admin/Super Instructor only.
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'course:update_any' }, async (ctx) => {
        const { id: courseId } = await context.params;
        const body = await request.json();
        
        const validation = updateCertificateSchema.safeParse(body);
        if (!validation.success) {
            return apiError('Validation failed', 400, validation.error.errors.map(e => ({ path: e.path.map(String), message: e.message })));
        }

        const { certificateTemplateId } = validation.data;

        // Validate template exists if provided
        if (certificateTemplateId) {
            const templateExists = await prisma.certificateTemplate.findUnique({
                where: { id: certificateTemplateId }
            });

            if (!templateExists) {
                return apiError('Certificate template not found', 400);
            }
        }

        try {
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

            return apiResponse({
                success: true,
                course
            });
        } catch (error: any) {
            // Not found
            if (error?.code === 'P2025') {
                return apiError('Course not found', 404);
            }
            throw error;
        }
    });
}
