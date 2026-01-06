import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

/**
 * GET /api/admin/certificates/templates
 * Lists all certificate templates (admin/instructor only).
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'certificate:template:read'))) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Missing permission: certificate:template:read' },
                { status: 403 }
            );
        }

        const templates = await prisma.certificateTemplate.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(templates);

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error fetching certificate templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

/**
 * POST /api/admin/certificates/templates
 * Creates a new certificate template.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'certificate:template:create'))) {
            return NextResponse.json(
                { error: 'FORBIDDEN', message: 'Missing permission: certificate:template:create' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, htmlBody, smartTags } = body;

        if (!name || !htmlBody) {
            return NextResponse.json(
                { error: 'BAD_REQUEST', message: 'name and htmlBody are required' },
                { status: 400 }
            );
        }

        const template = await prisma.certificateTemplate.create({
            data: {
                name,
                htmlBody,
                smartTags: smartTags || {},
                isSystem: false
            }
        });

        return NextResponse.json(template, { status: 201 });

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error creating certificate template:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
