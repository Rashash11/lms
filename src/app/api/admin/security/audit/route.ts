import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'security:audit:read'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const eventType = searchParams.get('eventType');
        const userId = searchParams.get('userId');

        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

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

        const query = `
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
        const events = await prisma.$queryRawUnsafe<any[]>(query, ...queryParams);

        const countQuery = `SELECT COUNT(*) FROM auth_audit_log l ${whereClause}`;
        const totalResult = await prisma.$queryRawUnsafe<any[]>(countQuery, ...params);
        const total = Number(totalResult[0]?.count || 0);

        // Map to format expected by UI
        const formattedEvents = events.map(e => ({
            id: e.id,
            userId: e.userId,
            eventType: e.eventType,
            ip: e.ip,
            userAgent: e.userAgent,
            meta: e.meta,
            createdAt: e.createdAt,
            users: e.email ? {
                email: e.email,
                firstName: e.firstName,
                lastName: e.lastName
            } : null
        }));

        return NextResponse.json({
            events: formattedEvents,
            total,
            limit,
            offset
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
