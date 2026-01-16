import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH /api/learning-paths/[id]/sections/[sectionId] - Update section name
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; sectionId: string } }
) {
    return withGuard(request, { permission: 'learning_path:update' }, async () => {

    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Section name is required' },
                { status: 400 }
            );
        }

        const section = await prisma.learningPathSection.update({
            where: { id: params.sectionId },
            data: { name },
            include: {
                courses: {
                    include: {
                        course: true
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        return NextResponse.json(section);
    } catch (error) {
        console.error('Failed to update section:', error);
        return NextResponse.json(
            { error: 'Failed to update section' },
            { status: 500 }
        );
    }

    });
}

// DELETE /api/learning-paths/[id]/sections/[sectionId] - Delete a section
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; sectionId: string } }
) {
    return withGuard(request, { permission: 'learning_path:update' }, async () => {

    try {
        // First, move all courses in this section to ungrouped (sectionId = null)
        await prisma.learningPathCourse.updateMany({
            where: { sectionId: params.sectionId },
            data: { sectionId: null }
        });

        // Then delete the section
        await prisma.learningPathSection.delete({
            where: { id: params.sectionId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete section:', error);
        return NextResponse.json(
            { error: 'Failed to delete section' },
            { status: 500 }
        );
    }

    });
}
