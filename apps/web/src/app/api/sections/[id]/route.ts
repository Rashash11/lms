import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSectionSchema = z.object({
    title: z.string().min(1).optional(),
    dripEnabled: z.boolean().optional(),
    dripType: z.enum(['hours', 'days']).nullable().optional(),
    dripValue: z.number().int().nullable().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        const body = await request.json();
        const validation = updateSectionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const section = await prisma.courseSection.update({
            where: { id: params.id },
            data: validation.data
        });

        return NextResponse.json(section);
    } catch (error) {
        console.error('Error updating section:', error);
        return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }

    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, {}, async () => {

    try {
        await prisma.courseSection.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting section:', error);
        return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }

    });
}
