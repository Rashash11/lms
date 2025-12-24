import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Support both single and bulk enrollment
const createEnrollmentSchema = z.object({
    userId: z.string().uuid('Valid user ID is required').optional(),
    userIds: z.array(z.string().uuid()).optional(),
    role: z.enum(['ADMIN', 'INSTRUCTOR', 'LEARNER']).optional().default('LEARNER'),
    status: z.string().optional().default('NOT_STARTED'),
}).refine(data => data.userId || (data.userIds && data.userIds.length > 0), {
    message: 'Either userId or userIds must be provided',
});

// GET all enrollments for a learning path with user details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = { pathId: params.id };

        const [enrollments, total] = await Promise.all([
            prisma.learningPathEnrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.learningPathEnrollment.count({ where }),
        ]);

        // Fetch user details for all enrollments
        const userIds = enrollments.map(e => e.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
            },
        });

        // Combine enrollment and user data
        let enrichedEnrollments = enrollments.map(enrollment => {
            const user = users.find(u => u.id === enrollment.userId);
            return {
                id: enrollment.id,
                userId: enrollment.userId,
                role: enrollment.role,
                status: enrollment.status,
                progress: enrollment.progress,
                enrolledAt: enrollment.enrolledAt,
                completedAt: enrollment.completedAt,
                expiresAt: enrollment.expiresAt,
                user: user ? {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    avatar: user.avatar,
                } : null,
            };
        });

        // Apply search filter if provided
        if (search) {
            enrichedEnrollments = enrichedEnrollments.filter(e => {
                const searchLower = search.toLowerCase();
                return e.user?.name.toLowerCase().includes(searchLower) ||
                    e.user?.email.toLowerCase().includes(searchLower);
            });
        }

        return NextResponse.json({
            enrollments: enrichedEnrollments,
            total: search ? enrichedEnrollments.length : total,
            page,
            limit,
            totalPages: Math.ceil((search ? enrichedEnrollments.length : total) / limit),
        });
    } catch (error) {
        console.error('Error fetching learning path enrollments:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
}

// POST create new enrollment(s) - supports single or bulk
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const validation = createEnrollmentSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;
        const userIdsToEnroll = data.userIds || (data.userId ? [data.userId] : []);

        if (userIdsToEnroll.length === 0) {
            return NextResponse.json({ error: 'No users specified' }, { status: 400 });
        }

        // Check if learning path exists
        const path = await prisma.learningPath.findUnique({ where: { id: params.id } });
        if (!path) {
            return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });
        }

        // Check for existing enrollments
        const existing = await prisma.learningPathEnrollment.findMany({
            where: {
                pathId: params.id,
                userId: { in: userIdsToEnroll },
            },
        });

        const alreadyEnrolledIds = existing.map(e => e.userId);
        const newUserIds = userIdsToEnroll.filter(id => !alreadyEnrolledIds.includes(id));

        if (newUserIds.length === 0) {
            return NextResponse.json(
                { error: 'All specified users are already enrolled', alreadyEnrolled: alreadyEnrolledIds },
                { status: 400 }
            );
        }

        // Create enrollments for new users
        const result = await prisma.learningPathEnrollment.createMany({
            data: newUserIds.map(userId => ({
                userId,
                pathId: params.id,
                role: data.role || 'LEARNER',
                status: data.status || 'NOT_STARTED',
                progress: 0,
                enrolledAt: new Date(),
            })),
        });

        return NextResponse.json({
            success: true,
            enrolled: result.count,
            skipped: alreadyEnrolledIds.length,
            alreadyEnrolled: alreadyEnrolledIds,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating learning path enrollment:', error);
        return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }
}

// DELETE remove enrollment
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const enrollmentId = searchParams.get('enrollmentId');
        const userId = searchParams.get('userId');

        if (!enrollmentId && !userId) {
            return NextResponse.json(
                { error: 'Either enrollmentId or userId is required' },
                { status: 400 }
            );
        }

        if (enrollmentId) {
            await prisma.learningPathEnrollment.delete({ where: { id: enrollmentId } });
        } else if (userId) {
            await prisma.learningPathEnrollment.delete({
                where: {
                    userId_pathId: {
                        userId,
                        pathId: params.id,
                    },
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting learning path enrollment:', error);
        return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 });
    }
}
