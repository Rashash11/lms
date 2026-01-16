import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    price: z.number().optional(),
});

// GET single category
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const category = await prisma.category.findUnique({
            where: { id: params.id },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Get children
        const children = await prisma.category.findMany({
            where: { parentId: params.id },
        });

        return NextResponse.json({ ...category, children });
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
    }

    });
}

// PUT update category
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const body = await request.json();

        const validation = updateCategorySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { name, description, parentId, price } = validation.data;

        // Prevent circular reference
        if (parentId === params.id) {
            return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { id: params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(parentId !== undefined && { parentId }),
                ...(price !== undefined && { price }),
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    });
}

// DELETE category
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        // Update children to have no parent
        await prisma.category.updateMany({
            where: { parentId: params.id },
            data: { parentId: null },
        });

        await prisma.category.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    });
}
