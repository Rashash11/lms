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
    paginationSchema,
    ValidationError
} from '@/lib/validations';
import { z } from 'zod';

// Query schema
const listQuerySchema = z.object({
    flat: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
    search: z.string().optional(),
});

// Category schema
const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    price: z.number().nonnegative().optional(),
});

/**
 * GET /api/categories
 * List all categories with hierarchy
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'categories:read'
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

        const { flat, search } = query;

        // 2. Build where clause
        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        // 3. Fetch categories
        const categories = await prisma.category.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        // Return flat list if requested
        if (flat) {
            return apiResponse({ data: categories });
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

        return apiResponse({
            data: hierarchy,
            total: categories.length
        });
    });
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'categories:create',
        roles: ['ADMIN'],
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        // 1. Validate body
        let data;
        try {
            data = await validateBody(request, categorySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { name, description, parentId, price } = data;

        // 2. Check parent exists
        if (parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: parentId },
            });
            if (!parent) {
                return apiError('Parent category not found', 400);
            }
        }

        // 3. Create category
        const category = await prisma.category.create({
            data: {
                name,
                description,
                parentId,
                price: price || null,
            },
        });

        return apiResponse(category, 201);
    });
}

/**
 * DELETE /api/categories
 * Bulk delete categories
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'categories:delete',
        roles: ['ADMIN'],
        auditEvent: 'SETTINGS_UPDATE',
    }, async (ctx: GuardedContext) => {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return apiError('No category IDs provided', 400);
        }

        // Update children to have no parent (prevent orphans)
        await prisma.category.updateMany({
            where: { parentId: { in: ids } },
            data: { parentId: null },
        });

        // Delete categories
        const result = await prisma.category.deleteMany({
            where: { id: { in: ids } },
        });

        return apiResponse({ success: true, deleted: result.count });
    });
}

