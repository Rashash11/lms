import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateBranchSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    themeId: z.string().nullable().optional(),
    defaultLanguage: z.string().optional(),
    aiEnabled: z.boolean().optional(),
    settings: z.record(z.any()).optional(),
});

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

// PUT update branch
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = updateBranchSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
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

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.themeId !== undefined) updateData.themeId = data.themeId;
        if (data.defaultLanguage !== undefined) updateData.defaultLanguage = data.defaultLanguage;
        if (data.aiEnabled !== undefined) updateData.aiEnabled = data.aiEnabled;
        if (data.settings !== undefined) updateData.settings = data.settings;

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
