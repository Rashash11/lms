import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const createGroupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
    price: z.number().nonnegative('Price must be 0 or greater').optional().nullable(),
    groupKey: z.string().optional().nullable(),
    autoEnroll: z.boolean().optional(),
    maxMembers: z.number().int().positive().optional(),
    branchId: z.string().uuid().optional(),
    generateKey: z.boolean().optional(), // Generate join key
});

// GET all groups with member/course counts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const [groups, total] = await Promise.all([
            prisma.group.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { members: true, courses: true }
                    }
                }
            }),
            prisma.group.count({ where }),
        ]);

        // Transform to include counts
        const groupsWithCounts = groups.map((group: any) => ({
            ...group,
            memberCount: group._count.members,
            courseCount: group._count.courses,
            _count: undefined,
        }));

        return NextResponse.json({
            groups: groupsWithCounts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

// POST create group
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createGroupSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { name, description, price, groupKey, autoEnroll, maxMembers, branchId, generateKey } = validation.data;

        // Generate unique key if requested
        let finalKey = groupKey || null;
        if (generateKey && !finalKey) {
            finalKey = randomBytes(4).toString('hex').toUpperCase();
        }

        const group = await prisma.group.create({
            data: {
                name,
                description,
                price,
                groupKey: finalKey,
                autoEnroll: autoEnroll || false,
                maxMembers,
                branchId,
            },
        });

        return NextResponse.json(group, { status: 201 });
    } catch (error) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}

// DELETE bulk delete groups
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No group IDs provided' }, { status: 400 });
        }

        // Delete members and courses first (cascade should handle, but being explicit)
        await prisma.groupMember.deleteMany({ where: { groupId: { in: ids } } });
        await prisma.groupCourse.deleteMany({ where: { groupId: { in: ids } } });

        const result = await prisma.group.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting groups:', error);
        return NextResponse.json({ error: 'Failed to delete groups' }, { status: 500 });
    }
}
