import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAuthAudit } from "@/lib/audit-logger";
import { can } from "@/lib/permissions";

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'security:sessions:read'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Since auth_session table is missing in DB/Schema, we fallback to auth_audit_log
        // to show recent successful logins as "sessions".
        let whereClause = "WHERE l.event_type = 'LOGIN_SUCCESS'";
        const params: any[] = [];
        if (userId) {
            whereClause += " AND l.user_id = $1";
            params.push(userId);
        }

        const query = `
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

        const logEntries = await prisma.$queryRawUnsafe<any[]>(query, ...params);

        // Transform for UI
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
                lastActiveAt: s.createdAt, // Approximation
                createdAt: s.createdAt,
                isCurrent: false // We can't easily determine this without a session ID in the cookie
            };
        });

        return NextResponse.json({ sessions: formattedSessions });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!(await can(session, 'security:sessions:revoke'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id'); // In this fallback, this is an audit log ID

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID required" }, { status: 400 });
        }

        // Without a real session table, we can only "revoke" by incrementing token_version
        // which logs the user out of ALL devices.

        // Find which user this log entry belongs to
        const entries = await prisma.$queryRawUnsafe<any[]>(
            'SELECT user_id FROM auth_audit_log WHERE id = $1',
            sessionId
        );

        const targetUserId = entries[0]?.user_id;

        if (!targetUserId) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Global revoke for this user
        await prisma.$executeRawUnsafe(
            'UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = $1',
            targetUserId
        );

        await logAuthAudit({
            eventType: "LOGOUT_ALL",
            userId: session.userId,
            metadata: {
                targetUserId,
                reason: "Administrative revocation from Sessions page"
            }
        });

        return NextResponse.json({ success: true, message: "User sessions revoked globally" });

    } catch (error) {
        console.error("Error revoking session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
