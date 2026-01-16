import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
const createSectionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    orderIndex: z.number().int().optional(),
    dripEnabled: z.boolean().optional().default(false),
    dripType: z.enum(['hours', 'days']).nullable().optional(),
    dripValue: z.number().int().nullable().optional(),
});

// GET all sections for a course
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:read' }, async () => {

    try {
        const sections = await prisma.courseSection.findMany({
            where: { courseId: params.id },
            orderBy: { orderIndex: 'asc' },
            include: { units: { orderBy: { orderIndex: 'asc' } } }
        });

        return NextResponse.json(sections);
    } catch (error) {
        console.error('Error fetching sections:', error);
        return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    });
}

// POST create new section
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const body = await request.json();
        const validation = createSectionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const data = validation.data;

        // Get next order if not provided
        let orderIndexValue = data.orderIndex;
        if (orderIndexValue === undefined) {
            const maxOrder = await prisma.courseSection.findFirst({
                where: { courseId: params.id },
                orderBy: { orderIndex: 'desc' },
                select: { orderIndex: true }
            });
            orderIndexValue = (maxOrder?.orderIndex ?? -1) + 1;
        }

        const section = await prisma.courseSection.create({
            data: {
                courseId: params.id,
                title: data.title,
                orderIndex: orderIndexValue,
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

    });
}
