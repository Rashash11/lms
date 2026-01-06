import { prisma } from "@/lib/prisma";

type AuditEventType = "LOGIN_SUCCESS" | "LOGIN_FAIL" | "LOGOUT" | "NODE_SWITCH" | "LOGOUT_ALL" | "PASSWORD_CHANGE";

interface AuditLogData {
    eventType: AuditEventType;
    userId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

/**
 * Fail-open audit logger - never crashes auth flows
 * Logs to database if possible, falls back to console in dev
 */
export async function logAuthAudit(data: AuditLogData): Promise<void> {
    try {
        await prisma.$executeRaw`
            INSERT INTO auth_audit_log (event_type, user_id, ip_address, user_agent, metadata, created_at)
            VALUES (
                ${data.eventType}::varchar,
                ${data.userId || null}::varchar,
                ${data.ip || null}::varchar,
                ${data.userAgent || null}::text,
                ${JSON.stringify(data.metadata || {})}::jsonb,
                NOW()
            )
        `;
    } catch (error) {
        // Fail-open: log to console in development, silent in production
        if (process.env.NODE_ENV !== 'production') {
            console.error('[AUDIT LOG FAILED]', {
                eventType: data.eventType,
                userId: data.userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        // Never throw - audit logging must never crash auth
    }
}

/**
 * Extract IP from request headers
 */
export function getClientIp(headers: Headers): string {
    return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        "unknown";
}

/**
 * Extract user agent from request headers
 */
export function getClientUserAgent(headers: Headers): string {
    return headers.get("user-agent") || "unknown";
}
