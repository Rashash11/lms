import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reorderSchema = z.object({
    sections: z.array(z.object({
        id: z.string().uuid(),
        order_index: z.number().int(),
    })).optional(),
    units: z.array(z.object({
        id: z.string().uuid(),
        sectionId: z.string().uuid().nullable(),
        order_index: z.number().int(),
    })).optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const { sections, units } = validation.data;

        await prisma.$transaction(async (tx) => {
            // Update sections reorder
            if (sections && sections.length > 0) {
                for (const section of sections) {
                    await tx.courseSection.update({
                        where: { id: section.id, courseId: params.id },
                        data: { order_index: section.order_index }
                    });
                }
            }

            // Update units reorder and section moving
            if (units && units.length > 0) {
                for (const unit of units) {
                    await tx.courseUnit.update({
                        where: { id: unit.id, courseId: params.id },
                        data: {
                            order_index: unit.order_index,
                            sectionId: unit.sectionId
                        } as any
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in reorder API:', error);
        return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
    }
}
