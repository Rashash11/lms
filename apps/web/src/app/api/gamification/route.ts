import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateBody, validateQuery, ValidationError } from '@/lib/validations';
import { jobs } from '@/lib/jobs';
import { z } from 'zod';

// Query schema
const querySchema = z.object({
    userId: z.string().uuid(),
});

// Award points schema
const awardPointsSchema = z.object({
    userId: z.string().uuid(),
    points: z.number().int(),
    reason: z.string().min(1),
});

/**
 * GET /api/gamification
 * Get user's gamification stats
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'gamification:read'
    }, async (ctx: GuardedContext) => {
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, querySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { userId } = query;

        // Get user's total points
        const pointsData = await prisma.pointsLedger.aggregate({
            where: { userId },
            _sum: { points: true },
        });
        const totalPoints = pointsData._sum.points || 0;

        // Get user's level
        const level = await prisma.level.findFirst({
            where: { pointsRequired: { lte: totalPoints } },
            orderBy: { pointsRequired: 'desc' },
        });

        // Get next level
        const nextLevel = await prisma.level.findFirst({
            where: { pointsRequired: { gt: totalPoints } },
            orderBy: { pointsRequired: 'asc' },
        });

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

        return apiResponse({
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
            badges: [],
            badgeCount: 0,
            leaderboardPosition: usersWithMorePoints.length + 1,
            recentActivity: recentPoints,
        });
    });
}

/**
 * POST /api/gamification
 * Award points to user
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'gamification:create',
        auditEvent: 'GAMIFICATION_CHANGE',
    }, async (ctx: GuardedContext) => {
        let data;
        try {
            data = await validateBody(request, awardPointsSchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { userId, points, reason } = data;

        // Add points
        await prisma.pointsLedger.create({
            data: { userId, points, reason },
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

        // Queue timeline event
        jobs.timeline.addEvent({
            userId,
            tenantId: ctx.session.tenantId,
            eventType: 'POINTS_EARNED',
            details: { points, reason, newTotal: newTotal._sum.points },
        }).catch(console.error);

        return apiResponse({
            success: true,
            pointsAwarded: points,
            newTotal: newTotal._sum.points,
            currentLevel: newLevel,
        });
    });
}
