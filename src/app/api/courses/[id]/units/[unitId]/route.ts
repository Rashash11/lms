import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateUnitSchema = z.object({
    type: z.enum(['TEXT', 'FILE', 'EMBED', 'VIDEO', 'TEST', 'SURVEY', 'ASSIGNMENT', 'ILT', 'SCORM', 'XAPI', 'CMI5', 'TALENTCRAFT', 'SECTION']).optional(),
    title: z.string().min(1).optional(),
    content: z.any().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED_CHANGES']).optional(),
    isSample: z.boolean().optional(),
});

// GET single unit
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; unitId: string } }
) {
    try {
        const unit = await prisma.courseUnit.findUnique({
            where: { id: params.unitId },
        });

        if (!unit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        }

        if (unit.courseId !== params.id) {
            return NextResponse.json({ error: 'Unit does not belong to this course' }, { status: 403 });
        }

        return NextResponse.json(unit);
    } catch (error) {
        console.error('Error fetching unit:', error);
        return NextResponse.json({ error: 'Failed to fetch unit' }, { status: 500 });
    }
}

// PUT update unit
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; unitId: string } }
) {
    try {
        const body = await request.json();

        const validation = updateUnitSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Verify unit belongs to course
        const existingUnit = await prisma.courseUnit.findUnique({
            where: { id: params.unitId },
        });

        if (!existingUnit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        }

        if (existingUnit.courseId !== params.id) {
            return NextResponse.json({ error: 'Unit does not belong to this course' }, { status: 403 });
        }

        const updateData: any = {};
        if (data.type !== undefined) updateData.type = data.type;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.isSample !== undefined) updateData.isSample = data.isSample;

        const unit = await prisma.courseUnit.update({
            where: { id: params.unitId },
            data: updateData,
        });

        return NextResponse.json(unit);
    } catch (error) {
        console.error('Error updating unit:', error);
        return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 });
    }
}

// DELETE unit
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; unitId: string } }
) {
    try {
        // Verify unit belongs to course
        const existingUnit = await prisma.courseUnit.findUnique({
            where: { id: params.unitId },
        });

        if (!existingUnit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        }

        if (existingUnit.courseId !== params.id) {
            return NextResponse.json({ error: 'Unit does not belong to this course' }, { status: 403 });
        }

        await prisma.courseUnit.delete({
            where: { id: params.unitId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting unit:', error);
        return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 });
    }
}
