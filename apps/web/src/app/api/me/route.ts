import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withGuard, apiResponse, apiError, GuardedContext } from '@/lib/api-guard';


export const dynamic = 'force-dynamic';
/**
 * GET /api/me
 * Get current user info (mirror of /api/auth/me)
 */
export async function GET(request: NextRequest) {
    return withGuard(request, {}, async (ctx: GuardedContext) => {
        const user = await prisma.user.findUnique({
            where: { id: ctx.session.userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                activeRole: true,
                isActive: true,
                isVerified: true,
            },
        });

        if (!user) {
            return apiError('User not found', 404);
        }

        return apiResponse({
            ok: true,
            claims: {
                userId: ctx.session.userId,
                email: ctx.session.email,
                roles: [ctx.session.role],
                activeRole: ctx.session.role,
                tenantId: ctx.session.tenantId,
                nodeId: ctx.session.nodeId,
                ver: ctx.session.tokenVersion ?? 0,
                exp: Math.floor(Date.now() / 1000) + 900,
                iss: 'lms-auth',
                aud: 'lms-api',
            },
            user,
        });
    });
}
