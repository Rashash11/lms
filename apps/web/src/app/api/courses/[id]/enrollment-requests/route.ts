import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET enrollment requests for a course

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:read' }, async () => {

    try {
        const requests = await prisma.enrollmentRequest.findMany({
            where: {
                courseId: params.id,
                status: 'pending',
            },
            orderBy: { createdAt: 'desc' },
        });

        // Fetch user details for each request
        const userIds = requests.map(r => r.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });

        const enrichedRequests = requests.map(request => {
            const user = users.find(u => u.id === request.userId);
            return {
                id: request.id,
                userId: request.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                userEmail: user?.email || '',
                requestedAt: request.createdAt,
                status: request.status,
            };
        });

        return NextResponse.json({ requests: enrichedRequests });
    } catch (error) {
        console.error('Error fetching enrollment requests:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollment requests' }, { status: 500 });
    }

    });
}

// POST create a new enrollment request (for students to request access)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Check if request already exists
        const existing = await prisma.enrollmentRequest.findFirst({
            where: {
                courseId: params.id,
                userId,
                status: 'pending',
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
        }

        // Create the request
        const enrollmentRequest = await prisma.enrollmentRequest.create({
            data: {
                courseId: params.id,
                userId,
                status: 'pending',
            },
        });

        return NextResponse.json(enrollmentRequest, { status: 201 });
    } catch (error) {
        console.error('Error creating enrollment request:', error);
        return NextResponse.json({ error: 'Failed to create enrollment request' }, { status: 500 });
    }

    });
}
