import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createDiscussionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    courseId: z.string().uuid().optional(),
});

// GET all discussions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const courseId = searchParams.get('courseId') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.topic = { contains: search, mode: 'insensitive' };
        }

        if (courseId) {
            where.audienceType = 'COURSE';
            where.audienceId = courseId;
        }

        const [discussions, total] = await Promise.all([
            prisma.discussion.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.discussion.count({ where }),
        ]);

        const discussionIds = discussions.map((d) => d.id);
        const counts = discussionIds.length
            ? await prisma.discussionComment.groupBy({
                by: ['discussionId'],
                where: { discussionId: { in: discussionIds } },
                _count: { id: true },
            })
            : [];

        const countMap = new Map(counts.map((c) => [c.discussionId, c._count.id]));

        const discussionsWithCounts = discussions.map((d) => ({
            ...d,
            postCount: countMap.get(d.id) || 0,
        }));

        return NextResponse.json({
            discussions: discussionsWithCounts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching discussions:', error);
        return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
    }
}

// POST create discussion
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createDiscussionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        const discussion = await prisma.discussion.create({
            data: {
                topic: data.title,
                body: data.description || '',
                audienceType: data.courseId ? 'COURSE' : 'EVERYONE',
                audienceId: data.courseId || null,
                createdBy: 'system', // TODO: Get from session
            },
        });

        return NextResponse.json(discussion, { status: 201 });
    } catch (error) {
        console.error('Error creating discussion:', error);
        return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
    }
}

// DELETE bulk delete
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No discussion IDs provided' }, { status: 400 });
        }

        // Delete comments first
        await prisma.discussionComment.deleteMany({
            where: { discussionId: { in: ids } },
        });

        const result = await prisma.discussion.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('Error deleting discussions:', error);
        return NextResponse.json({ error: 'Failed to delete discussions' }, { status: 500 });
    }
}
