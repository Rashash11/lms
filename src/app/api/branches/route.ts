import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for branch creation/update
const branchSchema = z.object({
    // IDENTITY
    name: z.string()
        .min(3, 'Name must be at least 3 characters')
        .regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens'),
    slug: z.string().optional(), // Auto-generated from name
    title: z.string().optional(),
    description: z.string().max(255, 'Description must be 255 characters or less').optional(),
    isActive: z.boolean().default(false),

    // LOCALE
    languageCode: z.string().default('en'),
    timezone: z.string().default('UTC'),

    // ANNOUNCEMENTS
    internalAnnouncementEnabled: z.boolean().default(false),
    internalAnnouncement: z.string().optional(),
    externalAnnouncementEnabled: z.boolean().default(false),
    externalAnnouncement: z.string().optional(),

    // USERS
    signupMode: z.enum(['direct', 'invitation', 'approval']).default('direct'),
    allowedDomains: z.array(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'Invalid domain format')).optional(),
    maxRegistrations: z.number().int().positive().optional().nullable(),
    disallowMainDomainLogin: z.boolean().default(false),
    termsOfService: z.string().optional().nullable(),
    defaultUserTypeId: z.string().uuid().optional().nullable(),
    defaultGroupId: z.string().uuid().optional().nullable(),

    // E-COMMERCE
    ecommerceProcessor: z.enum(['none', 'stripe', 'paypal']).optional().nullable(),
    subscriptionEnabled: z.boolean().default(false),
    creditsEnabled: z.boolean().default(false),

    // GAMIFICATION
    badgeSet: z.enum(['old-school', 'modern', 'minimal']).default('old-school'),

    // AI SETTINGS
    aiFeaturesEnabled: z.boolean().default(false),

    // BRANDING
    brandingLogoUrl: z.string().optional().nullable(),
    brandingFaviconUrl: z.string().optional().nullable(),
    defaultCourseImageUrl: z.string().optional().nullable(),

    // Legacy fields
    themeId: z.string().optional(),
    defaultLanguage: z.string().default('en'),
    aiEnabled: z.boolean().default(true),
    settings: z.record(z.any()).optional(),
}).passthrough();

// Helper to generate slug from name
function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// GET all branches with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
            ];
        }

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

        return NextResponse.json({
            branches,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching branches:', error);
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}

// POST create new branch
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = branchSchema.safeParse(body);
        if (!validation.success) {
            console.error('Validation failed:', validation.error.errors);
            return NextResponse.json(
                { error: validation.error.errors[0].message, details: validation.error.errors },
                { status: 400 }
            );
        }

        const data = validation.data;
        console.log('Validated data:', JSON.stringify(data, null, 2));

        // Generate slug from name if not provided
        const slug = data.slug || generateSlug(data.name);

        // Get default tenant
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            // Create default tenant if none exists
            tenant = await prisma.tenant.create({
                data: {
                    domain: 'default.local',
                    name: 'Default Tenant',
                    settings: {},
                },
            });
        }

        // Check slug uniqueness within tenant
        const existingBranch = await prisma.branch.findFirst({
            where: {
                tenantId: tenant.id,
                slug: slug
            },
        });

        if (existingBranch) {
            return NextResponse.json(
                { error: 'Branch with this slug already exists' },
                { status: 400 }
            );
        }

        const branch = await prisma.branch.create({
            data: {
                tenantId: tenant.id,
                name: data.name,
                slug: slug,
                title: data.title,
                description: data.description,
                isActive: data.isActive,

                // LOCALE
                languageCode: data.languageCode,
                timezone: data.timezone,

                // ANNOUNCEMENTS
                internalAnnouncementEnabled: data.internalAnnouncementEnabled,
                internalAnnouncement: data.internalAnnouncement,
                externalAnnouncementEnabled: data.externalAnnouncementEnabled,
                externalAnnouncement: data.externalAnnouncement,

                // USERS
                signupMode: data.signupMode,
                allowedDomains: data.allowedDomains || [],
                maxRegistrations: data.maxRegistrations,
                disallowMainDomainLogin: data.disallowMainDomainLogin,
                termsOfService: data.termsOfService,
                defaultUserTypeId: data.defaultUserTypeId,
                defaultGroupId: data.defaultGroupId,

                // E-COMMERCE
                ecommerceProcessor: data.ecommerceProcessor,
                subscriptionEnabled: data.subscriptionEnabled,
                creditsEnabled: data.creditsEnabled,

                // GAMIFICATION
                badgeSet: data.badgeSet,

                // AI SETTINGS
                aiFeaturesEnabled: data.aiFeaturesEnabled,

                // BRANDING
                brandingLogoUrl: data.brandingLogoUrl,
                brandingFaviconUrl: data.brandingFaviconUrl,
                defaultCourseImageUrl: data.defaultCourseImageUrl,

                // Legacy fields
                themeId: data.themeId,
                defaultLanguage: data.defaultLanguage,
                aiEnabled: data.aiEnabled,
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

        return NextResponse.json(branch, { status: 201 });
    } catch (error) {
        console.error('Error creating branch:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
        return NextResponse.json({ error: 'Failed to create branch', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// DELETE bulk delete branches
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No branch IDs provided' }, { status: 400 });
        }

        const result = await prisma.branch.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting branches:', error);
        return NextResponse.json({ error: 'Failed to delete branches' }, { status: 500 });
    }
}
