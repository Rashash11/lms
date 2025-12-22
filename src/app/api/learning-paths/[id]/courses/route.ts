import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/learning-paths/[id]/courses - Add course to learning path
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { courseId, unlockType, unlockCourseId, minScore, sectionId } = body;

        if (!courseId) {
            return NextResponse.json(
                { error: 'courseId is required' },
                { status: 400 }
            );
        }

        // Validate unlockType
        const validUnlockTypes = ['NONE', 'AFTER_COURSE', 'AFTER_SCORE'];
        const finalUnlockType = unlockType || 'NONE';

        if (!validUnlockTypes.includes(finalUnlockType)) {
            return NextResponse.json(
                { error: 'Invalid unlock type' },
                { status: 400 }
            );
        }

        // Check if learning path exists
        const learningPath = await prisma.learningPath.findUnique({
            where: { id: params.id },
            include: {
                courses: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!learningPath) {
            return NextResponse.json(
                { error: 'Learning path not found' },
                { status: 404 }
            );
        }

        // Check course limit (max 25)
        if (learningPath.courses.length >= 25) {
            return NextResponse.json(
                { error: 'Maximum 25 courses allowed per learning path' },
                { status: 400 }
            );
        }

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        // Check if course already added
        const existing = await prisma.learningPathCourse.findFirst({
            where: {
                pathId: params.id,
                courseId,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Course already added to this learning path' },
                { status: 400 }
            );
        }

        // Get next order number
        const maxOrder = learningPath.courses.length > 0
            ? Math.max(...learningPath.courses.map(c => c.order))
            : 0;
        const newOrder = maxOrder + 1;

        // Validate unlock conditions
        if (finalUnlockType === 'AFTER_COURSE' || finalUnlockType === 'AFTER_SCORE') {
            if (!unlockCourseId) {
                return NextResponse.json(
                    { error: 'unlockCourseId is required for this unlock type' },
                    { status: 400 }
                );
            }

            // Check if unlock course exists in this path
            const unlockCourse = learningPath.courses.find(c => c.courseId === unlockCourseId);

            if (!unlockCourse) {
                return NextResponse.json(
                    { error: 'Unlock course not found in this learning path' },
                    { status: 400 }
                );
            }

            // Prevent forward dependencies (can only depend on earlier courses)
            if (unlockCourse.order >= newOrder) {
                return NextResponse.json(
                    { error: 'Can only depend on earlier courses in the path' },
                    { status: 400 }
                );
            }

            // Validate minScore for AFTER_SCORE type
            if (finalUnlockType === 'AFTER_SCORE') {
                if (minScore === undefined || minScore === null) {
                    return NextResponse.json(
                        { error: 'minScore is required for AFTER_SCORE unlock type' },
                        { status: 400 }
                    );
                }

                if (typeof minScore !== 'number' || minScore < 0 || minScore > 100) {
                    return NextResponse.json(
                        { error: 'minScore must be between 0 and 100' },
                        { status: 400 }
                    );
                }
            }
        }

        // Add course to path
        const pathCourse = await prisma.learningPathCourse.create({
            data: {
                pathId: params.id,
                courseId,
                order: newOrder,
                sectionId: sectionId || null,
                unlockType: finalUnlockType,
                unlockCourseId: (finalUnlockType === 'AFTER_COURSE' || finalUnlockType === 'AFTER_SCORE') ? unlockCourseId : null,
                minScore: finalUnlockType === 'AFTER_SCORE' ? minScore : null,
            },
            include: {
                course: true,
            },
        });

        return NextResponse.json(pathCourse, { status: 201 });
    } catch (error) {
        console.error('Failed to add course to learning path:', error);
        return NextResponse.json(
            { error: 'Failed to add course' },
            { status: 500 }
        );
    }
}

// DELETE /api/learning-paths/[id]/courses?courseId=xxx - Remove course from learning path
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json(
                { error: 'courseId is required' },
                { status: 400 }
            );
        }

        // Find the learning path course entry
        const pathCourse = await prisma.learningPathCourse.findFirst({
            where: {
                pathId: params.id,
                courseId,
            },
        });

        if (!pathCourse) {
            return NextResponse.json(
                { error: 'Course not found in this learning path' },
                { status: 404 }
            );
        }

        // Reset any courses that depend on this course
        // Find all courses where unlockCourseId matches the courseId being removed
        const dependentCourses = await prisma.learningPathCourse.findMany({
            where: {
                pathId: params.id,
                unlockCourseId: courseId,
            },
        });

        // Reset dependent courses to NONE unlock type
        for (const dependent of dependentCourses) {
            await prisma.learningPathCourse.update({
                where: { id: dependent.id },
                data: {
                    unlockType: 'NONE',
                    unlockCourseId: null,
                    minScore: null,
                },
            });
        }

        // Delete the course from path
        await prisma.learningPathCourse.delete({
            where: { id: pathCourse.id },
        });

        // Reorder remaining courses to fill the gap
        const remainingCourses = await prisma.learningPathCourse.findMany({
            where: { pathId: params.id },
            orderBy: { order: 'asc' },
        });

        // Update orders sequentially
        for (let i = 0; i < remainingCourses.length; i++) {
            await prisma.learningPathCourse.update({
                where: { id: remainingCourses[i].id },
                data: { order: i + 1 },
            });
        }

        return NextResponse.json({ message: 'Course removed successfully' });
    } catch (error) {
        console.error('Failed to remove course from learning path:', error);
        return NextResponse.json(
            { error: 'Failed to remove course' },
            { status: 500 }
        );
    }
}
