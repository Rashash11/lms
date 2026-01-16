import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateQuery, paginationSchema, ValidationError } from '@/lib/validations';
import { logAuthAudit } from '@/lib/audit-logger';
import { z } from 'zod';

// Query schema
const sessionsQuerySchema = paginationSchema.extend({
    userId: z.string().uuid().optional(),
});

/**
 * GET /api/admin/security/sessions
 * View active sessions (from audit logs)
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'security:sessions:read',
        roles: ['ADMIN'],
    }, async (ctx: GuardedContext) => {
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, sessionsQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { userId } = query;

        let whereClause = "WHERE l.event_type = 'LOGIN_SUCCESS'";
        const params: any[] = [];
        if (userId) {
            whereClause += " AND l.user_id = $1";
            params.push(userId);
        }

        const query_sql = `
            SELECT 
                l.id, 
                l.user_id as "userId", 
                l.ip_address as "ip", 
                l.user_agent as "userAgent", 
                l.created_at as "createdAt",
                u.email as "userEmail",
                u."firstName",
                u."lastName"
            FROM auth_audit_log l
            LEFT JOIN users u ON l.user_id = u.id
            ${whereClause}
            ORDER BY l.created_at DESC
            LIMIT 100
        `;

        const logEntries = await prisma.$queryRawUnsafe(query_sql, ...params) as any[];

        const formattedSessions = logEntries.map(s => {
            const userAgent = s.userAgent || "";
            const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

            return {
                id: s.id,
                userId: s.userId,
                userEmail: s.userEmail || "unknown",
                userName: s.firstName ? `${s.firstName} ${s.lastName}` : "Unknown User",
                ip: s.ip || "0.0.0.0",
                userAgent: userAgent,
                deviceType: isMobile ? 'mobile' : 'desktop',
                lastActiveAt: s.createdAt,
                createdAt: s.createdAt,
                isCurrent: false
            };
        });

        return apiResponse({ data: formattedSessions });
    });
}

/**
 * DELETE /api/admin/security/sessions
 * Revoke user sessions
 */
export async function DELETE(request: NextRequest) {
    return withGuard(request, {
        permission: 'security:sessions:revoke',
        roles: ['ADMIN'],
        auditEvent: 'SESSION_REVOKE',
    }, async (ctx: GuardedContext) => {
        const { searchParams } = request.nextUrl;
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return apiError('Session ID required', 400);
        }

        const entries = await prisma.$queryRawUnsafe(
            'SELECT user_id FROM auth_audit_log WHERE id = $1',
            sessionId
        ) as any[];

        const targetUserId = entries[0]?.user_id;

        if (!targetUserId) {
            return apiError('Session not found', 404);
        }

        // Global revoke for this user
        await prisma.$executeRawUnsafe(
            'UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = $1',
            targetUserId
        );

        await logAuthAudit({
            eventType: "LOGOUT_ALL",
            userId: ctx.session.userId,
            metadata: {
                targetUserId,
                reason: "Administrative revocation"
            }
        });

        return apiResponse({ success: true, message: "User sessions revoked globally" });
    });
}
