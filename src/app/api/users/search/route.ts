import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users/search - Search users for enrollment
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const excludeCourseId = searchParams.get('excludeCourseId');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Base filter - search by name or email
        const whereClause: any = {};

        if (query.length > 0) {
            whereClause.OR = [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { username: { contains: query, mode: 'insensitive' } },
            ];
        }

        // Get users already enrolled in the course (to exclude them)
        let excludeUserIds: string[] = [];
        if (excludeCourseId) {
            const enrolled = await prisma.enrollment.findMany({
                where: { courseId: excludeCourseId },
                select: { userId: true },
            });
            excludeUserIds = enrolled.map(e => e.userId);
        }

        // Exclude already enrolled users
        if (excludeUserIds.length > 0) {
            whereClause.id = { notIn: excludeUserIds };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                status: true,
            },
            take: limit,
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' },
            ],
        });

        // Format response
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            avatar: user.avatar,
            status: user.status,
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error) {
        console.error('Error searching users:', error);
        return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }
}
