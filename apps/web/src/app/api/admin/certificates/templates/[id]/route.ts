import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError } from '@/lib/api-guard';
import { z } from 'zod';

// Validation schemas
const updateTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    htmlBody: z.string().min(1).optional(),
    smartTags: z.array(z.string()).optional()
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/certificates/templates/[id]
 * Gets a single certificate template.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'certificate:template:read' }, async (ctx) => {
        const { id } = await context.params;

        const template = await prisma.certificateTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return apiError('Template not found', 404);
        }

        return apiResponse(template);
    });
}

/**
 * PUT /api/admin/certificates/templates/[id]
 * Updates a certificate template.
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'certificate:template:update' }, async (ctx) => {
        const { id } = await context.params;
        const body = await request.json();
        
        const validation = updateTemplateSchema.safeParse(body);
        if (!validation.success) {
            return apiError('Validation failed', 400, validation.error.errors.map(e => ({ path: e.path.map(String), message: e.message })));
        }

        try {
            const template = await prisma.certificateTemplate.update({
                where: { id },
                data: validation.data
            });
            return apiResponse(template);
        } catch (error: any) {
            if (error?.code === 'P2025') {
                return apiError('Template not found', 404);
            }
            throw error;
        }
    });
}

/**
 * DELETE /api/admin/certificates/templates/[id]
 * Deletes a certificate template.
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, { permission: 'certificate:template:delete' }, async (ctx) => {
        const { id } = await context.params;

        // Prevent deletion of system templates
        const template = await prisma.certificateTemplate.findUnique({
            where: { id },
            select: { isSystem: true }
        });

        if (template?.isSystem) {
            return apiError('Cannot delete system templates', 403);
        }

        try {
            await prisma.certificateTemplate.delete({
                where: { id }
            });
            return apiResponse({ success: true, message: 'Template deleted' });
        } catch (error: any) {
            if (error?.code === 'P2025') {
                return apiError('Template not found', 404);
            }
            throw error;
        }
    });
}
