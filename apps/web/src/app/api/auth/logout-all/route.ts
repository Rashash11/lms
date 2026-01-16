import { NextRequest, NextResponse } from "next/server";
import { withGuard, GuardedContext, apiResponse, apiError } from "@/lib/api-guard";
import { getUnscopedPrisma } from "@/lib/prisma";
const prisma = getUnscopedPrisma();

export const dynamic = 'force-dynamic';

/**
 * Global logout - invalidates all tokens by incrementing tokenVersion
 * This forces re-authentication on all devices
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        auditEvent: 'LOGOUT_ALL',
    }, async (context: GuardedContext) => {
        try {
            // Validate tenantId is present
            if (!context.session.tenantId) {
                console.error('[LOGOUT-ALL] Missing tenantId in session');
                return apiError('Tenant context required', 400);
            }

            console.log('[LOGOUT-ALL] Attempting to update user:', {
                tenantId: context.session.tenantId,
                userId: context.session.userId
            });

            // Increment tokenVersion to invalidate all existing tokens
            await prisma.user.update({
                where: { tenantId_id: { tenantId: context.session.tenantId, id: context.session.userId } },
                data: {
                    tokenVersion: { increment: 1 }
                }
            });

            console.log('[LOGOUT-ALL] User tokenVersion incremented successfully');

            const response = apiResponse({
                ok: true,
                message: "All sessions invalidated"
            });

            // Clear current session cookie
            response.cookies.delete("session");

            return response;
        } catch (error: any) {
            console.error('[LOGOUT-ALL] Error:', error.message, error.stack);
            return apiError(`Logout failed: ${error.message}`, 500);
        }
    });
}
