import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET user's gamification stats (points, badges, level, leaderboard position)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get user's total points
        const pointsData = await prisma.pointsLedger.aggregate({
            where: { userId },
            _sum: { points: true },
        });
        const totalPoints = pointsData._sum.points || 0;

        // Get user's level based on points
        const level = await prisma.level.findFirst({
            where: { pointsRequired: { lte: totalPoints } },
            orderBy: { pointsRequired: 'desc' },
        });

        // Get next level
        const nextLevel = await prisma.level.findFirst({
            where: { pointsRequired: { gt: totalPoints } },
            orderBy: { pointsRequired: 'asc' },
        });

        const userBadges: Array<{
            badge: { id: string; name: string; description: string | null; image: string };
            earnedAt: Date;
        }> = [];

        // Get recent points history
        const recentPoints = await prisma.pointsLedger.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Calculate leaderboard position
        const usersWithMorePoints = await prisma.pointsLedger.groupBy({
            by: ['userId'],
            _sum: { points: true },
            having: {
                points: { _sum: { gt: totalPoints } }
            }
        });

        return NextResponse.json({
            points: totalPoints,
            level: level ? {
                number: level.levelNumber,
                name: level.name,
                badge: level.badge,
            } : null,
            nextLevel: nextLevel ? {
                number: nextLevel.levelNumber,
                name: nextLevel.name,
                pointsRequired: nextLevel.pointsRequired,
                pointsToGo: nextLevel.pointsRequired - totalPoints,
            } : null,
            badges: userBadges.map((ub) => ({
                id: ub.badge.id,
                name: ub.badge.name,
                description: ub.badge.description,
                image: ub.badge.image,
                earnedAt: ub.earnedAt,
            })),
            badgeCount: userBadges.length,
            leaderboardPosition: usersWithMorePoints.length + 1,
            recentActivity: recentPoints,
        });
    } catch (error) {
        console.error('Error fetching gamification data:', error);
        return NextResponse.json({ error: 'Failed to fetch gamification data' }, { status: 500 });
    }
}

// POST award points to user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, points, reason } = body;

        if (!userId || !points || !reason) {
            return NextResponse.json(
                { error: 'userId, points, and reason are required' },
                { status: 400 }
            );
        }

        // Add points
        const pointsEntry = await prisma.pointsLedger.create({
            data: {
                userId,
                points,
                reason,
            },
        });

        // Get new total
        const newTotal = await prisma.pointsLedger.aggregate({
            where: { userId },
            _sum: { points: true },
        });

        // Check for level up
        const newLevel = await prisma.level.findFirst({
            where: { pointsRequired: { lte: newTotal._sum.points || 0 } },
            orderBy: { pointsRequired: 'desc' },
        });

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId,
                eventType: 'POINTS_EARNED',
                details: { points, reason, newTotal: newTotal._sum.points },
            },
        });

        return NextResponse.json({
            success: true,
            pointsAwarded: points,
            newTotal: newTotal._sum.points,
            currentLevel: newLevel,
        });
    } catch (error) {
        console.error('Error awarding points:', error);
        return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
    }
}
