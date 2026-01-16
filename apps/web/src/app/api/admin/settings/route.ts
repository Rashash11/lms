import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateBody, settingsSchemas, ValidationError } from '@/lib/validations';

/**
 * GET /api/admin/settings
 * Fetch site-wide settings and feature flags
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'organization:read', // Was settings:read
    }, async (ctx: GuardedContext) => {
        const [tenant, featureFlags] = await Promise.all([
            prisma.tenant.findUnique({
                where: { id: ctx.session.tenantId },
                select: {
                    name: true,
                    settings: true,
                    updatedAt: true,
                }
            }),
            prisma.portalFeatureFlags.findUnique({
                where: { tenantId: ctx.session.tenantId }
            })
        ]);

        if (!tenant) {
            return apiError('Tenant not found', 404);
        }

        const settings = (tenant.settings as any) || {};

        return apiResponse({
            site: {
                name: tenant.name,
                description: settings.description || '',
                logoUrl: settings.logoUrl || null,
                faviconUrl: settings.faviconUrl || null,
            },
            branding: settings.branding || {
                primaryColor: '#000000',
                secondaryColor: '#ffffff',
                fontFamily: 'Inter, sans-serif',
            },
            registration: settings.registration || {
                allowedDomains: [],
                signupMode: 'direct',
                maxRegistrations: null,
                termsOfService: null,
            },
            localization: settings.localization || {
                defaultLanguage: 'en',
                timezone: 'UTC',
            },
            features: {
                prerequisitesEnabled: featureFlags?.prerequisitesEnabled ?? true,
                learningPathsEnabled: featureFlags?.learningPathsEnabled ?? false,
                messagingEnabled: featureFlags?.messagingEnabled ?? false,
                gamificationEnabled: settings.features?.gamificationEnabled ?? true,
                planTier: featureFlags?.planTier || 'FREE',
            },
            updatedAt: tenant.updatedAt,
        });
    });
}

/**
 * POST /api/admin/settings
 * Update site-wide settings
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'settings:update',
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        let body;
        try {
            body = await validateBody(request, settingsSchemas.update);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: ctx.session.tenantId }
        });

        if (!tenant) {
            return apiError('Tenant not found', 404);
        }

        const currentSettings = (tenant.settings as any) || {};

        // Merge updates
        const newSettings = {
            ...currentSettings,
            description: body.site?.description ?? currentSettings.description,
            logoUrl: body.site?.logoUrl ?? currentSettings.logoUrl,
            faviconUrl: body.site?.faviconUrl ?? currentSettings.faviconUrl,
            branding: {
                ...(currentSettings.branding || {}),
                ...(body.branding || {}),
            },
            registration: {
                ...(currentSettings.registration || {}),
                ...(body.registration || {}),
            },
            localization: {
                ...(currentSettings.localization || {}),
                ...(body.localization || {}),
            },
            features: {
                ...(currentSettings.features || {}),
                ...(body.features || {}),
            }
        };

        // Update Tenant and Feature Flags in transaction
        await prisma.$transaction(async (tx) => {
            await tx.tenant.update({
                where: { id: ctx.session.tenantId },
                data: {
                    name: body.site?.name ?? tenant.name,
                    settings: newSettings,
                }
            });

            if (body.features) {
                const ffData: any = {};
                if (body.features.prerequisitesEnabled !== undefined) ffData.prerequisitesEnabled = body.features.prerequisitesEnabled;
                if (body.features.learningPathsEnabled !== undefined) ffData.learningPathsEnabled = body.features.learningPathsEnabled;
                if (body.features.messagingEnabled !== undefined) ffData.messagingEnabled = body.features.messagingEnabled;

                if (Object.keys(ffData).length > 0) {
                    await tx.portalFeatureFlags.upsert({
                        where: { tenantId: ctx.session.tenantId },
                        create: {
                            tenantId: ctx.session.tenantId,
                            planTier: 'ENTERPRISE', // Default for now
                            ...ffData
                        },
                        update: ffData
                    });
                }
            }
        });

        return apiResponse({ success: true, message: 'Settings updated successfully' });
    });
}
