import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

import { canManageCourse } from '@/lib/permissions';

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
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        // Build filter based on role
        const where: any = {};

        if (courseId) {
            where.courseId = courseId;
        }

        // ROLE-BASED ACCESS CONTROL
        if (session.activeRole === 'LEARNER') {
            // Learner can see:
            // 1. Assignments from courses they're enrolled in (with learner-specific filtering)
            // 2. Non-course assignments where they are specifically assigned

            if (courseId) {
                // Verify enrollment
                const enrollment = await prisma.enrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId: session.userId,
                            courseId: courseId
                        }
                    }
                });

                if (!enrollment) {
                    return NextResponse.json({ error: 'FORBIDDEN: Not enrolled in this course' }, { status: 403 });
                }

                // Show assignments from this course with learner filtering
                where.courseId = courseId;
                where.OR = [
                    { assignedLearners: { none: {} } },
                    { assignedLearners: { some: { userId: session.userId } } }
                ];
            } else {
                // Return assignments for all enrolled courses + non-course assignments
                const enrollments = await prisma.enrollment.findMany({
                    where: { userId: session.userId },
                    select: { courseId: true }
                });
                const courseIds = enrollments.map(e => e.courseId);

                // Show:
                // 1. Assignments from enrolled courses (no specific learners OR learner is assigned)
                // 2. Non-course assignments where learner is specifically assigned
                where.OR = [
                    {
                        AND: [
                            { courseId: { in: courseIds } },
                            {
                                OR: [
                                    { assignedLearners: { none: {} } },
                                    { assignedLearners: { some: { userId: session.userId } } }
                                ]
                            }
                        ]
                    },
                    {
                        AND: [
                            { courseId: null },
                            { assignedLearners: { some: { userId: session.userId } } }
                        ]
                    }
                ];
            }
        }
        else if (session.activeRole === 'INSTRUCTOR') {
            // Instructor can see:
            // 1. Assignments for courses they manage
            // 2. Assignments where they are the assigned grading instructor

            if (courseId) {
                // Check if instructor manages this course OR is assigned to grade
                const course = await prisma.course.findUnique({
                    where: { id: courseId },
                    include: { instructors: true }
                });

                const isManager = canManageCourse(session, course);

                if (!isManager) {
                    // Not a manager, but might still see assignments they're assigned to grade
                    where.assignedInstructorId = session.userId;
                }
            } else {
                // Return assignments for all managed courses OR where they're assigned to grade
                const managedCourses = await prisma.course.findMany({
                    where: {
                        OR: [
                            { instructorId: session.userId },
                            { instructors: { some: { userId: session.userId } } }
                        ]
                    },
                    select: { id: true }
                });
                const courseIds = managedCourses.map(c => c.id);

                // Show assignments from managed courses OR assigned to this instructor
                where.OR = [
                    { courseId: { in: courseIds } },
                    { assignedInstructorId: session.userId }
                ];
            }
        }
        // ADMIN and SUPER_INSTRUCTOR see everything (respecting courseId filter if provided)

        const assignments = await (prisma as any).assignment.findMany({
            where,
            include: {
                assignedLearners: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                },
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

        // Strict Role Check: Learner cannot create assignments
        if (session.activeRole === 'LEARNER') {
            return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createAssignmentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        }

        const {
            title, description, courseId, dueAt, attachments,
            type, gradingMethod, availableFrom, closeAt, allowLate, latePenalty, maxLateDays,
            maxFiles, maxSizeMb, maxAttempts, allowedFileTypes, allowText, allowFile,
            plagiarismCheck, similarityThreshold, requireAIDeclaration, lockAfterView,
            visibility, isGroupAssignment,
            notifyOnPublish, notifyOnDueDate, notifyOnSubmission,
            difficulty, estimatedDuration,
            assignedLearnerIds,
            assignedInstructorId
        } = validation.data;

        // Check permissions (Instructor can only create for their own courses)
        if (session.activeRole === 'INSTRUCTOR' && courseId) {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: { instructors: true }
            });

            const canManage = canManageCourse(session, course);
            if (!canManage) {
                return NextResponse.json({ error: 'You do not have permission to manage this course' }, { status: 403 });
            }
        }

        const assignment = await (prisma as any).assignment.create({
            data: {
                title,
                description,
                courseId: courseId || null,
                dueAt: dueAt ? new Date(dueAt) : null,
                createdBy: session.userId,
                attachments: attachments as any || [],

                // Enterprise Fields Mapping
                type: type || 'HOMEWORK',
                gradingMethod: gradingMethod || 'NUMERIC',
                availableFrom: availableFrom ? new Date(availableFrom) : null,
                closeAt: closeAt ? new Date(closeAt) : null,
                allowLate: allowLate ?? false,
                latePenalty,
                maxLateDays,

                maxFiles,
                maxSizeMb,
                maxAttempts,
                allowedFileTypes: allowedFileTypes ?? [],
                allowText: allowText ?? true,
                allowFile: allowFile ?? true,

                plagiarismCheck: plagiarismCheck ?? false,
                similarityThreshold,
                requireAIDeclaration: requireAIDeclaration ?? false,
                lockAfterView: lockAfterView ?? false,

                visibility: visibility || 'ALL',
                isGroupAssignment: isGroupAssignment ?? false,

                notifyOnPublish: notifyOnPublish ?? true,
                notifyOnDueDate: notifyOnDueDate ?? true,
                notifyOnSubmission: notifyOnSubmission ?? true,

                difficulty: difficulty || 'MEDIUM',
                estimatedDuration,

                // Assigned instructor for grading
                assignedInstructorId: assignedInstructorId || null,

                // Create learner assignments if specified
                assignedLearners: assignedLearnerIds && assignedLearnerIds.length > 0 ? {
                    create: assignedLearnerIds.map(userId => ({ userId }))
                } : undefined
            },
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error('Error creating assignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
