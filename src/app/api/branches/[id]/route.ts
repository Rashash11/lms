import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateBranchSchema = z.object({
    name: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
    title: z.string().nullable().optional(),
    description: z.string().max(255).nullable().optional(),
    isActive: z.boolean().optional(),
    languageCode: z.string().optional(),
    timezone: z.string().optional(),
    internalAnnouncementEnabled: z.boolean().optional(),
    internalAnnouncement: z.string().nullable().optional(),
    externalAnnouncementEnabled: z.boolean().optional(),
    externalAnnouncement: z.string().nullable().optional(),
    signupMode: z.enum(['direct', 'invitation', 'approval']).optional(),
    allowedDomains: z.array(z.string()).optional(),
    maxRegistrations: z.number().int().positive().nullable().optional(),
    disallowMainDomainLogin: z.boolean().optional(),
    termsOfService: z.string().nullable().optional(),
    defaultUserTypeId: z.string().uuid().nullable().optional(),
    defaultGroupId: z.string().uuid().nullable().optional(),
    ecommerceProcessor: z.string().nullable().optional(),
    subscriptionEnabled: z.boolean().optional(),
    creditsEnabled: z.boolean().optional(),
    badgeSet: z.string().optional(),
    aiFeaturesEnabled: z.boolean().optional(),
    brandingLogoUrl: z.string().nullable().optional(),
    brandingFaviconUrl: z.string().nullable().optional(),
    defaultCourseImageUrl: z.string().nullable().optional(),
    themeId: z.string().nullable().optional(),
    defaultLanguage: z.string().optional(),
    aiEnabled: z.boolean().optional(),
    settings: z.record(z.any()).optional(),
}).passthrough();

// GET single branch
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const branch = await prisma.branch.findUnique({
            where: { id: params.id },
            include: {
                tenant: true,
            },
        });

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json(branch);
    } catch (error) {
        console.error('Error fetching branch:', error);
        return NextResponse.json({ error: 'Failed to fetch branch' }, { status: 500 });
    }
}

// PATCH update branch
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = updateBranchSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message, details: validation.error.errors },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check slug uniqueness if changing
        if (data.slug) {
            const branch = await prisma.branch.findUnique({ where: { id: params.id } });
            const existingBranch = await prisma.branch.findFirst({
                where: {
                    tenantId: branch?.tenantId,
                    slug: data.slug,
                    id: { not: params.id },
                },
            });
            if (existingBranch) {
                return NextResponse.json(
                    { error: 'Branch with this slug already exists' },
                    { status: 400 }
                );
            }
        }

        // Build update data object - only include defined fields
        const updateData: any = {};
        Object.keys(data).forEach(key => {
            if (data[key as keyof typeof data] !== undefined) {
                updateData[key] = data[key as keyof typeof data];
            }
        });

        const branch = await prisma.branch.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(branch);
    } catch (error) {
        console.error('Error updating branch:', error);
        return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
    }
}

// PUT for backwards compatibility (alias to PATCH)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return PATCH(request, { params });
}

// DELETE branch
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.branch.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting branch:', error);
        return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
    }
}
