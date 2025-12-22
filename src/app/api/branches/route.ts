import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createBranchSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
    title: z.string().optional(),
    description: z.string().optional(),
    themeId: z.string().optional(),
    defaultLanguage: z.string().default('en'),
    aiEnabled: z.boolean().default(true),
    settings: z.record(z.any()).optional(),
});

// GET all branches with user/course counts
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

        const validation = createBranchSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

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
                slug: data.slug
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
                slug: data.slug,
                title: data.title,
                description: data.description,
                themeId: data.themeId,
                defaultLanguage: data.defaultLanguage,
                aiEnabled: data.aiEnabled,
                settings: data.settings || {},
            },
        });

        return NextResponse.json(branch, { status: 201 });
    } catch (error) {
        console.error('Error creating branch:', error);
        return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
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
