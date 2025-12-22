import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    price: z.number().optional(),
});

// GET all categories with hierarchy
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const flat = searchParams.get('flat') === 'true';
        const search = searchParams.get('search') || '';

        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const categories = await prisma.category.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        if (flat) {
            return NextResponse.json({ categories });
        }

        // Build hierarchy
        const categoryMap = new Map();
        const roots: any[] = [];

        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });

        categories.forEach(cat => {
            const node = categoryMap.get(cat.id);
            if (cat.parentId && categoryMap.has(cat.parentId)) {
                categoryMap.get(cat.parentId).children.push(node);
            } else {
                roots.push(node);
            }
        });

        // Build path strings (A > B > C)
        const buildPath = (node: any, parentPath: string = ''): any => {
            const path = parentPath ? `${parentPath} > ${node.name}` : node.name;
            return {
                ...node,
                path,
                children: node.children.map((child: any) => buildPath(child, path)),
            };
        };

        const hierarchy = roots.map(root => buildPath(root));

        return NextResponse.json({
            categories: hierarchy,
            total: categories.length
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// POST create category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = categorySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { name, description, parentId, price } = validation.data;

        // Check if parent exists
        if (parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: parentId },
            });
            if (!parent) {
                return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
            }
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
                parentId,
                price: price ? price : null,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

// DELETE bulk delete categories
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No category IDs provided' }, { status: 400 });
        }

        // Update children to have no parent
        await prisma.category.updateMany({
            where: { parentId: { in: ids } },
            data: { parentId: null },
        });

        // Delete categories
        const result = await prisma.category.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting categories:', error);
        return NextResponse.json({ error: 'Failed to delete categories' }, { status: 500 });
    }
}
