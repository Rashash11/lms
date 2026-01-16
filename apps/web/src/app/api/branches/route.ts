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
    validateQuery,
    branchSchemas,
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';

// Query schema
const listQuerySchema = paginationSchema.extend({
    search: z.string().optional(),
});

// Helper to generate slug from name
function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * GET /api/branches
 * List all branches with pagination
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'branches:read'
    }, async (ctx: GuardedContext) => {
        // 1. Validate query
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, listQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { search, page, limit } = query;
        const skip = (page - 1) * limit;

        // 2. Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
            ];
        }

        // 3. Fetch branches
        const [branches, total] = await Promise.all([
            prisma.branch.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: {
                        select: { name: true, domain: true }
                    },
                    defaultUserType: {
                        select: { id: true, name: true }
                    },
                    defaultGroup: {
                        select: { id: true, name: true }
                    }
                },
            }),
            prisma.branch.count({ where }),
        ]);

        return apiResponse({
            data: branches,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    });
}

/**
 * POST /api/branches
 * Create a new branch (admin only)
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'branches:create',
        roles: ['ADMIN'],
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, branchSchemas.create);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        // 2. Generate slug
        const slug = data.slug || generateSlug(data.name);

        // 3. Get tenant from session
        let tenantId = ctx.session.tenantId;

        if (!tenantId) {
            // Fallback to default tenant
            let tenant = await prisma.tenant.findFirst();
            if (!tenant) {
                tenant = await prisma.tenant.create({
                    data: {
                        domain: 'default.local',
                        name: 'Default Tenant',
                        settings: {},
                    },
                });
            }
            tenantId = tenant.id;
        }

        // 4. Check slug uniqueness
        const existingBranch = await prisma.branch.findFirst({
            where: { tenantId, slug }
        });

        if (existingBranch) {
            return apiError('Branch with this slug already exists', 400);
        }

        // 5. Create branch
        const branch = await prisma.branch.create({
            data: {
                tenantId,
                name: data.name,
                slug,
                title: data.title,
                description: data.description,
                isActive: data.isActive ?? false,
                languageCode: data.languageCode || 'en',
                timezone: data.timezone || 'UTC',
                internalAnnouncementEnabled: data.internalAnnouncementEnabled ?? false,
                internalAnnouncement: data.internalAnnouncement,
                externalAnnouncementEnabled: data.externalAnnouncementEnabled ?? false,
                externalAnnouncement: data.externalAnnouncement,
                signupMode: data.signupMode || 'direct',
                allowedDomains: data.allowedDomains || [],
                maxRegistrations: data.maxRegistrations,
                disallowMainDomainLogin: data.disallowMainDomainLogin ?? false,
                termsOfService: data.termsOfService,
                defaultUserTypeId: data.defaultUserTypeId,
                defaultGroupId: data.defaultGroupId,
                ecommerceProcessor: data.ecommerceProcessor,
                subscriptionEnabled: data.subscriptionEnabled ?? false,
                creditsEnabled: data.creditsEnabled ?? false,
                badgeSet: data.badgeSet || 'old-school',
                aiFeaturesEnabled: data.aiFeaturesEnabled ?? false,
                brandingLogoUrl: data.brandingLogoUrl,
                brandingFaviconUrl: data.brandingFaviconUrl,
                defaultCourseImageUrl: data.defaultCourseImageUrl,
                settings: data.settings || {},
            },
            include: {
                defaultUserType: {
                    select: { id: true, name: true }
                },
                defaultGroup: {
                    select: { id: true, name: true }
                }
            }
        });

        return apiResponse(branch, 201);
    });
}

/**
 * DELETE /api/branches
 * Bulk delete branches (admin only)
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'branches:delete',
        roles: ['ADMIN'],
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No branch IDs provided', 400);
        }

        const result = await prisma.branch.deleteMany({
            where: { id: { in: ids } },
        });

        return apiResponse({
            success: true,
            deleted: result.count
        });
    });
}

