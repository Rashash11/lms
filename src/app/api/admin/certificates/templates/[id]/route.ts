import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

/**
 * GET /api/admin/certificates/templates/[id]
 * Gets a single certificate template.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'certificate:template:read'))) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Missing permission: certificate:template:read' },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        const template = await prisma.certificateTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching certificate template:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/certificates/templates/[id]
 * Updates a certificate template.
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'certificate:template:update'))) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Missing permission: certificate:template:update' },
                { status: 403 }
            );
        }

        const { id } = await context.params;
        const body = await request.json();
        const { name, htmlBody, smartTags } = body;

        const template = await prisma.certificateTemplate.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(htmlBody && { htmlBody }),
                ...(smartTags !== undefined && { smartTags })
            }
        });

        return NextResponse.json(template);

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
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        console.error('Error updating certificate template:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/certificates/templates/[id]
 * Deletes a certificate template.
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'certificate:template:delete'))) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Missing permission: certificate:template:delete' },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        // Prevent deletion of system templates
        const template = await prisma.certificateTemplate.findUnique({
            where: { id },
            select: { isSystem: true }
        });

        if (template?.isSystem) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Cannot delete system templates' },
                { status: 403 }
            );
        }

        await prisma.certificateTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Template deleted' });

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
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        console.error('Error deleting certificate template:', error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
