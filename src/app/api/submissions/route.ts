import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET submissions for grading
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'PENDING';
        const search = searchParams.get('search') || '';

        const where: any = {
            status: status
        };

        // ROLE-BASED ACCESS CONTROL
        if (session.activeRole === 'LEARNER') {
            // Learner can only see their own submissions
            where.userId = session.userId;
        }
        else if (session.activeRole === 'INSTRUCTOR') {
            // Instructor can only see submissions for their courses
            where.course = {
                OR: [
                    { instructorId: session.userId },
                    { instructors: { some: { userId: session.userId } } }
                ]
            };
        }
        // ADMIN / SUPER_INSTRUCTOR can see all

        if (search) {
            where.OR = [
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const submissions = await (prisma.assignmentSubmission as any).findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        // Mapping to match the frontend interface
        const formattedSubmissions = (submissions as any[]).map(sub => {
            return {
                id: sub.id,
                assignmentId: sub.assignmentId,
                studentName: `${(sub.user as any)?.firstName || ''} ${(sub.user as any)?.lastName || ''}`.trim(),
                assignmentTitle: sub.assignment?.title || 'Assignment',
                courseName: sub.course?.title || 'N/A',
                submittedAt: sub.submittedAt.toISOString(),
                status: sub.status,
                score: sub.score,
                content: sub.content,
                attachments: sub.attachments
            };
        });

        return NextResponse.json(formattedSubmissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
}

// POST - Create a new submission
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth();

        // Only learners can submit
        if (session.activeRole !== 'LEARNER') {
            return NextResponse.json({ error: 'Only learners can submit assignments' }, { status: 403 });
        }

        const body = await request.json();
        const { assignmentId, content, attachments } = body;

        if (!assignmentId) {
            return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
        }

        // Get the assignment to find courseId
        const assignment = await (prisma as any).assignment.findUnique({
            where: { id: assignmentId },
            select: {
                id: true,
                courseId: true,
                allowText: true,
                allowFile: true
            }
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        // Validate content based on assignment settings
        if (assignment.allowText && !assignment.allowFile && !content) {
            return NextResponse.json({ error: 'Text response is required' }, { status: 400 });
        }
        if (!assignment.allowText && assignment.allowFile && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ error: 'File upload is required' }, { status: 400 });
        }

        // Check if already submitted
        const existingSubmission = await (prisma.assignmentSubmission as any).findFirst({
            where: {
                assignmentId,
                userId: session.userId
            }
        });

        if (existingSubmission) {
            return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 400 });
        }

        // Create submission
        const submission = await (prisma.assignmentSubmission as any).create({
            data: {
                assignmentId,
                userId: session.userId,
                courseId: assignment.courseId,
                content: content || null,
                attachments: attachments || [],
                status: 'SUBMITTED',
                submittedAt: new Date()
            }
        });

        return NextResponse.json(submission, { status: 201 });
    } catch (error) {
        console.error('Error creating submission:', error);
        return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }
}

// PATCH - Grade a submission
export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth();

        // Learner cannot grade
        if (session.activeRole === 'LEARNER') {
            return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }

        const body = await request.json();
        const { id, score, comment, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
        }

        const submission = await (prisma.assignmentSubmission as any).findUnique({
            where: { id },
            include: {
                course: { include: { instructors: true } }
            }
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Instructor Permission Check
        if (session.activeRole === 'INSTRUCTOR') {
            const course = submission.course;
            if (!course || (course.instructorId !== session.userId && !course.instructors.some((i: any) => i.userId === session.userId))) {
                return NextResponse.json({ error: 'FORBIDDEN: You do not manage this course' }, { status: 403 });
            }
        }

        const updatedSubmission = await (prisma.assignmentSubmission as any).update({
            where: { id },
            data: {
                score: score !== undefined ? parseInt(score) : undefined,
                comment: comment || undefined,
                status: status || 'GRADED',
                gradedAt: new Date(),
                gradedBy: session.userId,
            }
        });

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        console.error('Error grading submission:', error);
        return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 });
    }
}

// PUT - Update learner comment
export async function PUT(request: NextRequest) {
    try {
        const session = await requireAuth();
        const body = await request.json();
        const { id, learnerComment } = body;

        if (!id) {
            return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
        }

        const submission = await (prisma.assignmentSubmission as any).findUnique({
            where: { id }
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Only owner can update learner comment
        if (submission.userId !== session.userId) {
            return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }

        const updatedSubmission = await (prisma.assignmentSubmission as any).update({
            where: { id },
            data: {
                learnerComment: learnerComment || undefined
            }
        });

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        console.error('Error updating learner comment:', error);
        return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }
}
