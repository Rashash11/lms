import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
const createPostSchema = z.object({
    content: z.string().min(1, 'Content is required'),
});

// GET single discussion with comments
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const discussion = await prisma.discussion.findUnique({
            where: { id: params.id },
        });

        if (!discussion) {
            return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
        }

        const [posts, postCount] = await Promise.all([
            prisma.discussionComment.findMany({
                where: { discussionId: params.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
            }),
            prisma.discussionComment.count({ where: { discussionId: params.id } }),
        ]);

        // Fetch user details for posts
        const userIds = [...new Set(posts.map((p) => p.createdBy))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, avatar: true }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const postsWithAuthors = posts.map((p) => ({
            ...p,
            author: userMap.get(p.createdBy),
        }));

        return NextResponse.json({
            ...discussion,
            posts: postsWithAuthors,
            postCount,
            totalPages: Math.ceil(postCount / limit),
        });
    } catch (error) {
        console.error('Error fetching discussion:', error);
        return NextResponse.json({ error: 'Failed to fetch discussion' }, { status: 500 });
    }

    });
}

// PUT update discussion
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const body = await request.json();
        const { title, description, courseId } = body;

        const discussion = await prisma.discussion.update({
            where: { id: params.id },
            data: {
                ...(title !== undefined && { topic: title }),
                ...(description !== undefined && { body: description }),
                ...(courseId !== undefined && {
                    audienceType: courseId ? 'COURSE' : 'EVERYONE',
                    audienceId: courseId || null,
                }),
            },
        });

        return NextResponse.json(discussion);
    } catch (error) {
        console.error('Error updating discussion:', error);
        return NextResponse.json({ error: 'Failed to update discussion' }, { status: 500 });
    }

    });
}

// DELETE discussion
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        await prisma.discussionComment.deleteMany({
            where: { discussionId: params.id },
        });

        await prisma.discussion.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting discussion:', error);
        return NextResponse.json({ error: 'Failed to delete discussion' }, { status: 500 });
    }

    });
}

// POST add a post to discussion
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const body = await request.json();

        const validation = createPostSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { content } = validation.data;
        const { authorId } = body;

        const post = await prisma.discussionComment.create({
            data: {
                discussionId: params.id,
                createdBy: authorId || 'system', // TODO: Get from session
                body: content,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Error adding post:', error);
        return NextResponse.json({ error: 'Failed to add post' }, { status: 500 });
    }

    });
}
