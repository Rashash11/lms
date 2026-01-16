import { prisma } from "@/lib/prisma";

/**
 * Comprehensive Audit Event Types
 * Organized by category for clarity
 */
export type AuditEventType =
    // Authentication
    | "LOGIN_SUCCESS"
    | "LOGIN_FAIL"
    | "LOGOUT"
    | "LOGOUT_ALL"
    | "TOKEN_REFRESH"
    | "PASSWORD_CHANGE"
    | "PASSWORD_RESET_REQUEST"
    | "PASSWORD_RESET_COMPLETE"
    | "MFA_ENABLED"
    | "MFA_DISABLED"
    | "ACCOUNT_LOCKED"
    | "ACCOUNT_UNLOCKED"
    // Session
    | "NODE_SWITCH"
    | "IMPERSONATION_START"
    | "IMPERSONATION_END"
    // User Management
    | "USER_CREATE"
    | "USER_UPDATE"
    | "USER_DELETE"
    | "USER_ACTIVATE"
    | "USER_DEACTIVATE"
    | "USER_IMPORT"
    // Role & Permission
    | "ROLE_ASSIGN"
    | "ROLE_REMOVE"
    | "PERMISSION_GRANT"
    | "PERMISSION_REVOKE"
    // Course Management
    | "COURSE_CREATE"
    | "COURSE_UPDATE"
    | "COURSE_DELETE"
    | "COURSE_PUBLISH"
    | "COURSE_UNPUBLISH"
    // Enrollment
    | "ENROLLMENT_CREATE"
    | "ENROLLMENT_DELETE"
    | "ENROLLMENT_COMPLETE"
    // Assessment
    | "TEST_SUBMIT"
    | "TEST_GRADE"
    | "ASSIGNMENT_SUBMIT"
    | "ASSIGNMENT_GRADE"
    // Certificate
    | "CERTIFICATE_ISSUE"
    | "CERTIFICATE_REVOKE"
    // Data Operations
    | "DATA_EXPORT"
    | "DATA_IMPORT"
    | "REPORT_GENERATE"
    // Settings
    | "SETTINGS_UPDATE"
    | "FEATURE_FLAG_CHANGE"
    // Security
    | "RATE_LIMIT_EXCEEDED"
    | "CSRF_VIOLATION"
    | "UNAUTHORIZED_ACCESS";

/**
 * Audit log data structure
 */
export interface AuditLogData {
    eventType: AuditEventType;
    tenantId?: string;
    userId?: string;
    targetUserId?: string;
    resourceType?: string;
    resourceId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Fail-open audit logger - never crashes auth flows
 * Logs to database if possible, falls back to console in dev
 */
export async function logAuthAudit(data: AuditLogData): Promise<void> {
    const severity = data.severity || getSeverity(data.eventType);

    try {
        if (process.env.AUTH_AUDIT_DEBUG === '1') {
            console.log("DEBUG: Executing auth_audit_log insert", JSON.stringify(data));
        }
        await prisma.$executeRaw`
            INSERT INTO auth_audit_log (
                id, tenant_id, event_type, user_id, 
                ip_address, user_agent, 
                metadata, created_at
            )
            VALUES (
                gen_random_uuid(),
                ${data.tenantId || null}::varchar,
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
 * Get default severity for event types
 */
function getSeverity(eventType: AuditEventType): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const criticalEvents: AuditEventType[] = [
        "LOGIN_FAIL", "ACCOUNT_LOCKED", "IMPERSONATION_START", "IMPERSONATION_END",
        "PERMISSION_GRANT", "PERMISSION_REVOKE", "ROLE_ASSIGN", "ROLE_REMOVE",
        "DATA_EXPORT", "DATA_IMPORT", "RATE_LIMIT_EXCEEDED", "CSRF_VIOLATION",
        "UNAUTHORIZED_ACCESS", "USER_DELETE"
    ];

    const highEvents: AuditEventType[] = [
        "LOGOUT_ALL", "PASSWORD_CHANGE", "PASSWORD_RESET_COMPLETE", "MFA_ENABLED",
        "MFA_DISABLED", "USER_CREATE", "COURSE_DELETE", "CERTIFICATE_REVOKE",
        "SETTINGS_UPDATE", "FEATURE_FLAG_CHANGE"
    ];

    const mediumEvents: AuditEventType[] = [
        "LOGIN_SUCCESS", "NODE_SWITCH", "USER_UPDATE", "COURSE_CREATE",
        "COURSE_PUBLISH", "ENROLLMENT_DELETE", "CERTIFICATE_ISSUE"
    ];

    if (criticalEvents.includes(eventType)) return "CRITICAL";
    if (highEvents.includes(eventType)) return "HIGH";
    if (mediumEvents.includes(eventType)) return "MEDIUM";
    return "LOW";
}

/**
 * Helper to log CRUD operations
 */
export async function logCrudAudit(
    action: "CREATE" | "UPDATE" | "DELETE",
    resourceType: string,
    resourceId: string,
    context: {
        tenantId?: string;
        userId?: string;
        ip?: string;
        userAgent?: string;
        changes?: Record<string, { before: any; after: any }>;
    }
): Promise<void> {
    const eventTypeMap: Record<string, Partial<Record<typeof action, AuditEventType>>> = {
        user: { CREATE: "USER_CREATE", UPDATE: "USER_UPDATE", DELETE: "USER_DELETE" },
        course: { CREATE: "COURSE_CREATE", UPDATE: "COURSE_UPDATE", DELETE: "COURSE_DELETE" },
        enrollment: { CREATE: "ENROLLMENT_CREATE", DELETE: "ENROLLMENT_DELETE" },
    };

    const eventType = eventTypeMap[resourceType.toLowerCase()]?.[action];

    if (!eventType) {
        // Fallback to console for unmapped types
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[AUDIT] ${action} ${resourceType}:${resourceId} by ${context.userId}`);
        }
        return;
    }

    await logAuthAudit({
        eventType,
        tenantId: context.tenantId,
        userId: context.userId,
        resourceType,
        resourceId,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: context.changes ? { changes: context.changes } : undefined,
    });
}

/**
 * Extract IP from request headers
 */
export function getClientIp(headers: Headers): string {
    return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        headers.get("cf-connecting-ip") ||
        "unknown";
}

/**
 * Extract user agent from request headers
 */
export function getClientUserAgent(headers: Headers): string {
    return headers.get("user-agent") || "unknown";
}

/**
 * Extract request context for audit logging
 */
export function getAuditContext(headers: Headers): { ip: string; userAgent: string } {
    return {
        ip: getClientIp(headers),
        userAgent: getClientUserAgent(headers),
    };
}

