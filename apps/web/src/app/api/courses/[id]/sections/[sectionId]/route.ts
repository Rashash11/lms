import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
const updateSectionSchema = z.object({
    title: z.string().min(1).optional(),
    orderIndex: z.number().int().optional(),
    dripEnabled: z.boolean().optional(),
    dripType: z.enum(['hours', 'days']).nullable().optional(),
    dripValue: z.number().int().nullable().optional(),
});

// GET single section
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; sectionId: string } }
) {
    return withGuard(request, { permission: 'course:read' }, async () => {

    try {
        const section = await prisma.courseSection.findUnique({
            where: { id: params.sectionId },
            include: { units: { orderBy: { orderIndex: 'asc' } } }
        });

        if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

        return NextResponse.json(section);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 });
    }

    });
}

// PUT update section
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; sectionId: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const body = await request.json();
        const validation = updateSectionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const section = await prisma.courseSection.update({
            where: { id: params.sectionId },
            data: validation.data
        });

        return NextResponse.json(section);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }

    });
}

// DELETE section
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; sectionId: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        // Find the section first to ensure it exists and belongs to the course
        const section = await prisma.courseSection.findFirst({
            where: { id: params.sectionId, courseId: params.id }
        });

        if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

        // Prisma schema has onDelete: SetNull for units, so they become unassigned
        await prisma.courseSection.delete({
            where: { id: params.sectionId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting section:', error);
        return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }

    });
}
