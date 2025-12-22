import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/learning-paths/[id]/courses/reorder - Reorder courses in learning path
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { courses } = body; // Array of { courseId, order }

        if (!Array.isArray(courses)) {
            return NextResponse.json(
                { error: 'courses must be an array' },
                { status: 400 }
            );
        }

        // Validate all courses belong to this path
        const pathCourses = await prisma.learningPathCourse.findMany({
            where: { pathId: params.id },
        });

        const pathCourseIds = pathCourses.map(pc => pc.courseId);
        const requestedCourseIds = courses.map(c => c.courseId);

        const allBelongToPath = requestedCourseIds.every(id =>
            pathCourseIds.includes(id)
        );

        if (!allBelongToPath) {
            return NextResponse.json(
                { error: 'Some courses do not belong to this learning path' },
                { status: 400 }
            );
        }

        // Update orders in transaction
        await prisma.$transaction(
            courses.map(({ courseId, order }) =>
                prisma.learningPathCourse.updateMany({
                    where: {
                        pathId: params.id,
                        courseId,
                    },
                    data: { order },
                })
            )
        );

        // Fetch updated learning path with courses
        const updatedPath = await prisma.learningPath.findUnique({
            where: { id: params.id },
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
        });

        return NextResponse.json(updatedPath);
    } catch (error) {
        console.error('Failed to reorder courses:', error);
        return NextResponse.json(
            { error: 'Failed to reorder courses' },
            { status: 500 }
        );
    }
}
