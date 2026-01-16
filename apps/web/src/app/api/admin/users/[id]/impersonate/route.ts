import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import {
    signAccessToken,
    signRefreshToken,
    setAuthCookiesOnResponse
} from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const impersonateSchema = z.object({
    reason: z.string().optional()
});

/**
 * POST /api/admin/users/[id]/impersonate
 * Start an impersonation session (Admin only)
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withGuard(request, {
        roles: ['ADMIN'],
        permission: 'user:impersonate',
        auditEvent: 'IMPERSONATION_START',
    }, async (ctx: GuardedContext) => {
        const { id: targetUserId } = await context.params;
        
        // Optional body validation
        let reason = 'Administrative impersonation';
        try {
            const body = await request.json();
            const validation = impersonateSchema.safeParse(body);
            if (validation.success && validation.data.reason) {
                reason = validation.data.reason;
            }
        } catch {
            // Ignore JSON parse error, body is optional
        }

        // 1. Fetch target user
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: { roles: true }
        });

        if (!targetUser) {
            return apiError('Target user not found', 404);
        }

        // 2. Prevent impersonating other Admins (unless self, but why)
        const isTargetAdmin = targetUser.roles.some(r => r.roleKey === 'ADMIN');
        if (isTargetAdmin) {
            return apiError('Cannot impersonate an Administrator', 403);
        }

        // 3. Create ImpersonationSession record
        const session = await prisma.impersonationSession.create({
            data: {
                tenantId: ctx.session.tenantId,
                adminId: ctx.session.userId,
                targetUserId: targetUser.id,
                reason,
                active: true,
            }
        });

        // 4. Generate tokens for target user with impersonation flags
        const impersonationPayload = {
            userId: targetUser.id,
            email: targetUser.email,
            activeRole: targetUser.activeRole,
            tenantId: ctx.session.tenantId,
            tokenVersion: targetUser.tokenVersion,
            isImpersonated: true,
            adminId: ctx.session.userId,
        };

        const [accessToken, refreshToken] = await Promise.all([
            signAccessToken(impersonationPayload),
            signRefreshToken(targetUser.id, targetUser.tokenVersion)
        ]);

        // 5. Build response with cookies
        const response = NextResponse.json({
            success: true,
            message: `Now impersonating ${targetUser.firstName} ${targetUser.lastName}`,
            user: {
                id: targetUser.id,
                email: targetUser.email,
                name: `${targetUser.firstName} ${targetUser.lastName}`,
            },
            impersonationId: session.id
        });

        setAuthCookiesOnResponse(response, accessToken, refreshToken);

        return response;
    });
}
