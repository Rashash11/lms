import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateBody, certificateSchemas, ValidationError } from '@/lib/validations';

/**
 * GET /api/admin/certificates/templates
 * List certificate templates
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'certificate:template:read',
        roles: ['ADMIN', 'INSTRUCTOR'],
    }, async (ctx: GuardedContext) => {
        const templates = await prisma.certificateTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return apiResponse({ data: templates });
    });
}

/**
 * POST /api/admin/certificates/templates
 * Create certificate template
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'certificate:template:create',
        roles: ['ADMIN'],
        auditEvent: 'CERTIFICATE_TEMPLATE_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, certificateSchemas.template);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const template = await prisma.certificateTemplate.create({
            data: {
                name: data.name,
                htmlBody: data.htmlBody,
                smartTags: data.smartTags || {},
                isSystem: false
            }
        });

        return apiResponse(template, 201);
    });
}
