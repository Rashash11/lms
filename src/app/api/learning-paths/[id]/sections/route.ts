import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/learning-paths/[id]/sections - Get all sections for a learning path
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sections = await prisma.learningPathSection.findMany({
            where: { pathId: params.id },
            orderBy: { order: 'asc' },
            include: {
                courses: {
                    include: {
                        course: true
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        return NextResponse.json(sections);
    } catch (error) {
        console.error('Failed to fetch sections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sections' },
            { status: 500 }
        );
    }
}

// POST /api/learning-paths/[id]/sections - Create a new section
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, order } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Section name is required' },
                { status: 400 }
            );
        }

        // If order not provided, get the max order + 1
        let sectionOrder = order;
        if (sectionOrder === undefined) {
            const maxSection = await prisma.learningPathSection.findFirst({
                where: { pathId: params.id },
                orderBy: { order: 'desc' }
            });
            sectionOrder = maxSection ? maxSection.order + 1 : 1;
        }

        const section = await prisma.learningPathSection.create({
            data: {
                pathId: params.id,
                name,
                order: sectionOrder
            },
            include: {
                courses: {
                    include: {
                        course: true
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        return NextResponse.json(section, { status: 201 });
    } catch (error) {
        console.error('Failed to create section:', error);
        return NextResponse.json(
            { error: 'Failed to create section' },
            { status: 500 }
        );
    }
}
