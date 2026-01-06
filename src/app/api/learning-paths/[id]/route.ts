import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';

// GET /api/learning-paths/[id] - Get single learning path
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'learning_path:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: learning_path:read' }, { status: 403 });
        }

        const learningPath = await prisma.learningPath.findUnique({
            where: { id: params.id },
            include: {
                courses: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                code: true,
                                status: true,
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                sections: {
                    include: {
                        courses: {
                            include: {
                                course: true,
                            },
                            orderBy: {
                                order: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });

        if (!learningPath) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(learningPath);
    } catch (error) {
        console.error('Failed to fetch learning path:', error);
        return NextResponse.json(
            { error: 'Failed to fetch learning path' },
            { status: 500 }
        );
    }
}

// PUT /api/learning-paths/[id] - Update learning path
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'learning_path:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: learning_path:update' }, { status: 403 });
        }

        const body = await request.json();
        const { name, code, category, description, status } = body;

        // Check if learning path exists
        const existing = await prisma.learningPath.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            );
        }

        // If updating code, check for duplicates
        if (code && code !== existing.code) {
            const duplicate = await prisma.learningPath.findUnique({
                where: { code },
            });
            if (duplicate) {
                return NextResponse.json(
                    { error: 'Learning path with this code already exists' },
                    { status: 400 }
                );
            }
        }

        // Update learning path
        const learningPath = await prisma.learningPath.update({
            where: { id: params.id },
            data: {
                name: name || existing.name,
                code: code !== undefined ? code : existing.code,
                category: category !== undefined ? category : existing.category,
                description: description !== undefined ? description : existing.description,
                status: status || existing.status,
            },
            include: {
                courses: true,
            },
        });

        return NextResponse.json(learningPath);
    } catch (error) {
        console.error('Failed to update learning path:', error);
        return NextResponse.json(
            { error: 'Failed to update learning path' },
            { status: 500 }
        );
    }
}

// DELETE /api/learning-paths/[id] - Delete learning path
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'learning_path:delete'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: learning_path:delete' }, { status: 403 });
        }

        // Check if learning path exists
        const existing = await prisma.learningPath.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            );
        }

        // Delete learning path (cascades to courses)
        await prisma.learningPath.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Learning path deleted successfully' });
    } catch (error) {
        console.error('Failed to delete learning path:', error);
        return NextResponse.json(
            { error: 'Failed to delete learning path' },
            { status: 500 }
        );
    }
}

// PATCH /api/learning-paths/[id] - Partial update learning path
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'learning_path:update'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: learning_path:update' }, { status: 403 });
        }

        const body = await request.json();
        const { name, code, category, description, isActive, image } = body;

        // Check if learning path exists
        const existing = await prisma.learningPath.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            );
        }

        // Validate description length
        if (description && description.length > 5000) {
            return NextResponse.json(
                { error: 'Description cannot exceed 5000 characters' },
                { status: 400 }
            );
        }

        // Validate name if provided
        if (name !== undefined && !name.trim()) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // If updating code, check for duplicates
        if (code && code !== existing.code) {
            const duplicate = await prisma.learningPath.findFirst({
                where: {
                    code,
                    id: { not: params.id }
                },
            });
            if (duplicate) {
                return NextResponse.json(
                    { error: 'Learning path with this code already exists' },
                    { status: 400 }
                );
            }
        }

        // Build update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code || null;
        if (category !== undefined) updateData.category = category || null;
        if (description !== undefined) updateData.description = description || null;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (image !== undefined) updateData.image = image || null;

        // Update learning path
        const learningPath = await prisma.learningPath.update({
            where: { id: params.id },
            data: updateData,
            include: {
                courses: {
                    include: {
                        course: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                sections: {
                    include: {
                        courses: {
                            include: {
                                course: true,
                            },
                            orderBy: {
                                order: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });

        return NextResponse.json(learningPath);
    } catch (error) {
        console.error('Failed to update learning path:', error);
        return NextResponse.json(
            { error: 'Failed to update learning path' },
            { status: 500 }
        );
    }
}
