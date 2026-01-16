import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {

    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateQuery, paginationSchema, ValidationError } from '@/lib/validations';
import { z } from 'zod';

// Query schema
const auditQuerySchema = paginationSchema.extend({
    eventType: z.string().optional(),
    userId: z.string().uuid().optional(),
});

/**
 * GET /api/admin/security/audit
 * View audit logs (admin only)
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withGuard(request, {
        permission: 'security:audit:read',
        roles: ['ADMIN'],
    }, async (ctx: GuardedContext) => {
        let query;
        try {
            query = validateQuery(request.nextUrl.searchParams, auditQuerySchema);
        } catch (e) {
            if (e instanceof ValidationError) {
                return apiError(e.message, 400, e.errors);
            }
            throw e;
        }

        const { eventType, userId, page, limit } = query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let pIdx = 1;

        if (eventType && eventType !== 'ALL') {
            whereClause += ` AND l.event_type = $${pIdx++}`;
            params.push(eventType);
        }
        if (userId) {
            whereClause += ` AND l.user_id = $${pIdx++}`;
            params.push(userId);
        }

        const query_sql = `
            SELECT 
                l.id, 
                l.event_type as "eventType", 
                l.user_id as "userId", 
                l.ip_address as "ip", 
                l.user_agent as "userAgent", 
                l.metadata as "meta", 
                l.created_at as "createdAt",
                u.email,
                u."firstName",
                u."lastName"
            FROM auth_audit_log l
            LEFT JOIN users u ON l.user_id = u.id
            ${whereClause}
            ORDER BY l.created_at DESC
            LIMIT $${pIdx++} OFFSET $${pIdx++}
        `;

        const queryParams = [...params, limit, offset];
        const events = await prisma.$queryRawUnsafe(query_sql, ...queryParams) as any[];

        const countQuery = `SELECT COUNT(*) FROM auth_audit_log l ${whereClause}`;
        const totalResult = await prisma.$queryRawUnsafe(countQuery, ...params) as any[];
        const total = Number(totalResult[0]?.count || 0);

        const formattedEvents = events.map(e => ({
            id: e.id,
            userId: e.userId,
            eventType: e.eventType,
            ip: e.ip,
            userAgent: e.userAgent,
            meta: e.meta,
            createdAt: e.createdAt,
            user: e.email ? {
                email: e.email,
                firstName: e.firstName,
                lastName: e.lastName
            } : null
        }));

        return apiResponse({
            data: formattedEvents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    });
}
