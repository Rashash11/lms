import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';
const unitTypes = ['TEXT', 'FILE', 'EMBED', 'VIDEO', 'TEST', 'SURVEY', 'ASSIGNMENT', 'ILT', 'SCORM', 'XAPI', 'CMI5', 'TALENTCRAFT', 'SECTION', 'WEB', 'AUDIO', 'DOCUMENT', 'IFRAME'] as const;

const createUnitSchema = z.object({
    type: z.enum(unitTypes),
    title: z.string().min(1, 'Title is required'),
    sectionId: z.string().uuid().nullable().optional(),
    config: z.any().optional().default({}),
    status: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED_CHANGES']).optional().default('DRAFT'),
    isSample: z.boolean().optional().default(false),
});

const updateUnitSchema = z.object({
    type: z.enum(unitTypes).optional(),
    title: z.string().min(1).optional(),
    sectionId: z.string().uuid().nullable().optional(),
    config: z.any().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED_CHANGES']).optional(),
    isSample: z.boolean().optional(),
});

const reorderSchema = z.object({
    units: z.array(z.object({
        id: z.string().uuid(),
        orderIndex: z.number().int().min(0),
    })),
});

// GET all units for a course
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:read' }, async () => {

    try {
        const units = await prisma.courseUnit.findMany({
            where: { courseId: params.id },
            orderBy: { orderIndex: 'asc' },
        });

        return NextResponse.json({ units, count: units.length });
    } catch (error) {
        console.error('Error fetching course units:', error);
        return NextResponse.json({ error: 'Failed to fetch course units' }, { status: 500 });
    }

    });
}

// POST create new unit
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const body = await request.json();

        const validation = createUnitSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Get the highest order number for this course
        const maxOrderUnit = await prisma.courseUnit.findFirst({
            where: { courseId: params.id },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true },
        });

        const nextOrder = (maxOrderUnit?.orderIndex ?? -1) + 1;

        const unit = await prisma.courseUnit.create({
            data: {
                courseId: params.id,
                type: data.type,
                title: data.title,
                config: data.config,
                status: data.status,
                isSample: data.isSample,
                orderIndex: nextOrder,
            },
        });

        return NextResponse.json(unit, { status: 201 });
    } catch (error) {
        console.error('Error creating course unit:', error);
        return NextResponse.json({ error: 'Failed to create course unit' }, { status: 500 });
    }

    });
}

// PATCH reorder units
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const body = await request.json();

        const validation = reorderSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { units } = validation.data;

        // Update all units in a transaction
        await prisma.$transaction(
            units.map(unit =>
                prisma.courseUnit.update({
                    where: { id: unit.id },
                    data: { orderIndex: unit.orderIndex },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering units:', error);
        return NextResponse.json({ error: 'Failed to reorder units' }, { status: 500 });
    }

    });
}
