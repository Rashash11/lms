import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSectionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    order_index: z.number().int().optional(),
    dripEnabled: z.boolean().optional().default(false),
    dripType: z.enum(['hours', 'days']).nullable().optional(),
    dripValue: z.number().int().nullable().optional(),
});

// GET all sections for a course
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sections = await prisma.courseSection.findMany({
            where: { courseId: params.id },
            orderBy: { order_index: 'asc' },
            include: { units: { orderBy: { order_index: 'asc' } } }
        });

        return NextResponse.json(sections);
    } catch (error) {
        console.error('Error fetching sections:', error);
        return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }
}

// POST create new section
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validation = createSectionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const data = validation.data;

        // Get next order if not provided
        let order_index = data.order_index;
        if (order_index === undefined) {
            const maxOrder = await prisma.courseSection.findFirst({
                where: { courseId: params.id },
                orderBy: { order_index: 'desc' },
                select: { order_index: true }
            });
            order_index = (maxOrder?.order_index ?? -1) + 1;
        }

        const section = await prisma.courseSection.create({
            data: {
                courseId: params.id,
                title: data.title,
                order_index: order_index,
                dripEnabled: data.dripEnabled,
                dripType: data.dripType,
                dripValue: data.dripValue,
            }
        });

        return NextResponse.json(section, { status: 201 });
    } catch (error) {
        console.error('Error creating section:', error);
        return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
    }
}
