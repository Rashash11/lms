import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { can } from '@/lib/permissions';

const createAssignmentSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    courseId: z.string().optional().nullable(),
    dueAt: z.string().datetime().optional().nullable(),
    attachments: z.array(z.any()).optional(),

    // Enterprise Fields
    type: z.enum(['HOMEWORK', 'QUIZ', 'PROJECT', 'LAB', 'RESEARCH', 'PRESENTATION']).optional(),
    gradingMethod: z.enum(['NUMERIC', 'PASS_FAIL', 'RUBRIC', 'WEIGHTED']).optional(),

    // Time & Availability
    availableFrom: z.string().datetime().optional().nullable(),
    closeAt: z.string().datetime().optional().nullable(),
    allowLate: z.boolean().optional(),
    latePenalty: z.number().optional(),
    maxLateDays: z.number().optional(),

    // Submission Settings
    maxFiles: z.number().optional(),
    maxSizeMb: z.number().optional(),
    maxAttempts: z.number().optional(),
    allowedFileTypes: z.array(z.string()).optional(),
    allowText: z.boolean().optional(),
    allowFile: z.boolean().optional(),

    // Integrity
    plagiarismCheck: z.boolean().optional(),
    similarityThreshold: z.number().optional(),
    requireAIDeclaration: z.boolean().optional(),
    lockAfterView: z.boolean().optional(),

    // Visibility
    visibility: z.enum(['ALL', 'GROUPS', 'DRAFT']).optional(),
    isGroupAssignment: z.boolean().optional(),

    // Notifications
    notifyOnPublish: z.boolean().optional(),
    notifyOnDueDate: z.boolean().optional(),
    notifyOnSubmission: z.boolean().optional(),

    // Metadata
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    estimatedDuration: z.number().optional(),

    // Learner Assignment
    assignedLearnerIds: z.array(z.string()).optional(),

    // Instructor Assignment
    assignedInstructorId: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'assignment:read'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: assignment:read' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        // Build filter based on role
        const where: any = {};

        if (courseId) {
            where.courseId = courseId;
        }

        // ROLE-BASED ACCESS CONTROL
        if (session.role === 'LEARNER') {
            // Fetch enrolled courses
            const enrollments = await prisma.enrollment.findMany({
                where: { userId: session.userId },
                select: { courseId: true }
            });
            const enrolledCourseIds = enrollments.map(e => e.courseId);

            if (courseId) {
                if (!enrolledCourseIds.includes(courseId)) {
                    return NextResponse.json({ error: 'FORBIDDEN: Not enrolled in this course' }, { status: 403 });
                }
                where.courseId = courseId;
            } else {
                // Show assignments from enrolled courses
                where.courseId = { in: enrolledCourseIds };
            }
        }
        else if (session.role === 'INSTRUCTOR') {
            if (courseId) {
                const course = await prisma.course.findUnique({
                    where: { id: courseId },
                    include: { instructors: true }
                });

                const isManager = course?.instructorId === session.userId ||
                    course?.instructors?.some((i: any) => i.userId === session.userId);

                if (!isManager) {
                    return NextResponse.json({ error: 'FORBIDDEN: You do not manage this course' }, { status: 403 });
                }
            } else {
                const managedCourses = await prisma.course.findMany({
                    where: {
                        OR: [
                            { instructorId: session.userId },
                            { instructors: { some: { userId: session.userId } } }
                        ]
                    },
                    select: { id: true }
                });
                const managedCourseIds = managedCourses.map(c => c.id);
                where.courseId = { in: managedCourseIds };
            }
        }

        const assignments = await (prisma as any).assignment.findMany({
            where,
            include: {
                course: {
                    select: {
                        title: true,
                        code: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();

        if (!(await can(session, 'assignment:create'))) {
            return NextResponse.json({ error: 'FORBIDDEN', reason: 'Missing permission: assignment:create' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createAssignmentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'BAD_REQUEST',
                message: validation.error.errors[0].message,
                details: validation.error.errors
            }, { status: 400 });
        }

        const { title, description, courseId, dueAt } = validation.data;

        // Check permissions (Instructor can only create for their own courses)
        if (session.role === 'INSTRUCTOR' && courseId) {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: { instructors: true }
            });

            if (!course) {
                return NextResponse.json({ error: 'NOT_FOUND', message: 'Course not found' }, { status: 404 });
            }

            const isManager = course.instructorId === session.userId ||
                (course.instructors as any[])?.some((i: any) => i.userId === session.userId);
            if (!isManager) {
                return NextResponse.json({ error: 'FORBIDDEN', message: 'You do not have permission to manage this course' }, { status: 403 });
            }
        }

        // Create assignment with only schema-valid fields
        const assignment = await prisma.assignment.create({
            data: {
                title,
                description: description || null,
                courseId: courseId || null,
                dueAt: dueAt ? new Date(dueAt) : null,
                createdBy: session.userId,
            },
        });

        return NextResponse.json(assignment, { status: 201 });
    } catch (error) {
        console.error('Error creating assignment:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Failed to create assignment' }, { status: 500 });
    }
}
