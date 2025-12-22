import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET leaderboard
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'all'; // all, month, week
        const limit = parseInt(searchParams.get('limit') || '20');

        // Calculate date filter
        let dateFilter = {};
        const now = new Date();
        if (period === 'month') {
            dateFilter = { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
        } else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { gte: weekAgo } };
        }

        // Aggregate points by user
        const leaderboard = await prisma.pointsLedger.groupBy({
            by: ['userId'],
            where: dateFilter,
            _sum: { points: true },
            orderBy: { _sum: { points: 'desc' } },
            take: limit,
        });

        // Get user details
        const userIds = leaderboard.map((l: any) => l.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, avatar: true }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        // Get levels for each user
        const levels = await prisma.level.findMany({
            orderBy: { pointsRequired: 'desc' },
        });

        const leaderboardWithDetails = leaderboard.map((entry: any, index: number) => {
            const user = userMap.get(entry.userId);
            const points = entry._sum.points || 0;
            const level = levels.find((l: any) => l.pointsRequired <= points);

            return {
                rank: index + 1,
                userId: entry.userId,
                user: user ? {
                    name: `${user.firstName} ${user.lastName}`,
                    avatar: user.avatar,
                } : null,
                points,
                level: level ? { number: level.levelNumber, name: level.name } : null,
            };
        });

        return NextResponse.json({
            leaderboard: leaderboardWithDetails,
            period,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
