
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessTokenLight, AuthError, RoleKey, AuthContext } from './auth';
import { getUserPermissions } from './permissions';
import { withTenantContext } from './tenant-context';
import { getUnscopedPrisma } from './prisma';
import { ValidationError } from './validations';
import { z } from 'zod';
import { logAuthAudit } from './audit-logger';
import { logger } from './logger';

export interface GuardedContext {
    session: AuthContext & { permissions: string[]; tenantId: string };
    params?: any; // For dynamic routes
}

export interface GuardOptions {
    roles?: RoleKey[];
    permission?: string;
    permissions?: string[];
    public?: boolean;
    auditEvent?: string;
    rateLimit?: string;
}

/**
 * Standardized API Guard wrapper.
 * Handles:
 * 1. Authentication (JWT verification)
 * 2. Authorization (Role & Permission checks)
 * 3. Tenant Context (via token)
 * 4. Audit Logging
 * 5. Error Handling
 */
export async function withGuard(
    request: NextRequest,
    options: GuardOptions,
    handler: (context: GuardedContext) => Promise<NextResponse>
) {
    const startTime = Date.now();
    try {
        // 1. Authentication (unless public)
        let session: AuthContext | null = null;

        session = await extractSession(request);

        if (!session && !options.public) {
            return apiError('Authentication required', 401);
        }

        if (session) {
            if (!session.tenantId && !options.public) {
                const tenantId = await inferTenantIdFromUser(session.userId);
                if (tenantId) {
                    session.tenantId = tenantId;
                }
            }

            if (!session.tenantId && !options.public) {
                return apiError('Missing tenant context', 401);
            }
            // 2. Role Check
            if (options.roles && options.roles.length > 0) {
                const role = session.role || session.activeRole;
                if (!options.roles.includes(role)) {
                    await logAccessDenied(request, session, 'role_mismatch', options);
                    return apiError('Forbidden: Insufficient role', 403);
                }
            }

            // 3. Permission Check
            const requiredPermissions = options.permission ? [options.permission] : (options.permissions || []);
            if (requiredPermissions.length) {
                // ADMIN Bypass - Admins have all permissions implicitly
                if (session.role === 'ADMIN') {
                    // Admin has all permissions
                } else {
                    const sessionWithPerms = session as AuthContext & { permissions: string[] };

                    if (!sessionWithPerms.permissions || sessionWithPerms.permissions.length === 0) {
                        sessionWithPerms.permissions = await getUserPermissions(session.userId, session.nodeId);
                    }

                    const hasAny = requiredPermissions.some((p) => sessionWithPerms.permissions.includes(p));
                    if (!hasAny) {
                        await logAccessDenied(request, session, 'permission_denied', options);
                        return apiError(`Forbidden: Missing permission`, 403, { requiredPermissions });
                    }
                }
            }

            // 4. CSRF Check (Double-submit cookie pattern) for mutations
            const pathname = new URL(request.url).pathname;
            const isAuthEndpoint = pathname.startsWith('/api/auth/');

            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !isAuthEndpoint) {
                const csrfHeader = request.headers.get('x-csrf-token');
                const csrfCookie = request.cookies.get('csrf-token')?.value;

                if (csrfCookie && csrfHeader !== csrfCookie) {
                    logger.warn('[API Guard] CSRF mismatch', { headerPresent: Boolean(csrfHeader), cookiePresent: Boolean(csrfCookie) });
                    return apiError('Forbidden: CSRF token mismatch', 403);
                }
            }
        }

        // 5. Execute Handler
        // Ensure session has permissions array even if empty (for consistency)
        const sessionWithPerms = (session ||
            ({
                userId: 'public',
                email: 'public@local',
                activeRole: 'LEARNER',
                role: 'LEARNER',
                tenantId: 'public',
            } as AuthContext)) as AuthContext & { permissions: string[]; tenantId: string };
        if (!sessionWithPerms.permissions) sessionWithPerms.permissions = [];
        if (session && session.tenantId) sessionWithPerms.tenantId = session.tenantId;

        const response = await withTenantContext(
            { tenantId: session?.tenantId, userId: session?.userId },
            () => handler({ session: sessionWithPerms })
        );

        if (session && session.tenantId && (response instanceof NextResponse)) {
            const cookie = request.cookies.get('session')?.value ?? '';
            if (cookie.length > 0) {
                try {
                    const payload = await verifyAccessTokenLight(cookie);
                    if (!payload.tenantId) {
                        const { signAccessToken } = await import('./auth');
                        const newToken = await signAccessToken({
                            userId: session.userId,
                            email: session.email,
                            activeRole: session.activeRole,
                            role: session.role,
                            tenantId: session.tenantId,
                            nodeId: session.nodeId,
                            tokenVersion: session.tokenVersion,
                            isImpersonated: session.isImpersonated,
                            adminId: session.adminId,
                        });
                        response.cookies.set('session', newToken, {
                            httpOnly: true,
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                            path: '/',
                            maxAge: 15 * 60,
                        });
                    }
                } catch {
                }
            }
        }

        // 6. Audit Logging (Async)
        if (options.auditEvent && session) {
            // We don't await this to keep response fast
            logAuthAudit({
                eventType: options.auditEvent as any,
                userId: session.userId,
                tenantId: session.tenantId,
                ip: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                metadata: {
                    path: request.nextUrl.pathname,
                    method: request.method,
                    duration: Date.now() - startTime
                }
            }).catch((e) => logger.error('Audit log failed', e));
        }

        return response;

    } catch (error) {
        logger.error('[API Guard] Uncaught error:', error);
        if (error instanceof AuthError) {
            return apiError(error.message, error.statusCode);
        }
        if (error instanceof ValidationError) {
            return apiError(error.message, 400, error.errors);
        }

        // Return JSON error instead of crashing (500)
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return apiError(message, 500);
    }
}

async function extractSession(request: NextRequest): Promise<AuthContext | null> {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) return null;

    try {
        // Use light verification to avoid DB hit for every request if possible
        // But if we need permissions, we might need DB or cached permissions
        const payload = await verifyAccessTokenLight(sessionCookie);

        return {
            userId: payload.userId,
            email: payload.email,
            activeRole: payload.activeRole,
            role: payload.activeRole,
            tenantId: payload.tenantId,
            // permissions: [], // Removed as it is not in AuthContext interface
            tokenVersion: payload.tokenVersion,
            nodeId: payload.nodeId,
            isImpersonated: payload.isImpersonated,
            adminId: payload.adminId
        };
    } catch (error) {
        if (error instanceof AuthError) throw error;
        // console.error('[API Guard] Session extraction failed:', error);
        return null;
    }
}

async function inferTenantIdFromUser(userId: string): Promise<string | undefined> {
    const prisma = getUnscopedPrisma();
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tenantId: true },
        });
        return user?.tenantId;
    } catch {
        return undefined;
    }
}

async function logAccessDenied(req: NextRequest, session: AuthContext, reason: string, options: GuardOptions) {
    logger.warn(`[API Guard] Access Denied: ${reason}`, {
        userId: session.userId,
        role: session.role,
        requiredRoles: options.roles,
        requiredPermission: options.permission,
        path: req.nextUrl.pathname
    });
}

// Helpers
export function apiResponse(data: any, status = 200) {
    return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 500, details?: any) {
    const body: any = { error: status === 500 ? 'INTERNAL_ERROR' : 'API_ERROR', message };
    if (details !== undefined) {
        body.details = details;
        body.errors = details;
    }
    return NextResponse.json(
        body,
        { status }
    );
}

// Zod Helper
export async function validateBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<T> {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(
            'Validation failed',
            result.error.errors.map(e => ({ path: e.path.map(String), message: e.message }))
        );
    }
    return result.data;
}

export function validateQuery<T>(req: NextRequest, schema: z.ZodSchema<T>): T {
    const url = new URL(req.url);
    const obj = Object.fromEntries(url.searchParams.entries());
    const result = schema.safeParse(obj);
    if (!result.success) {
        throw new ValidationError(
            'Invalid query parameters',
            result.error.errors.map(e => ({ path: e.path.map(String), message: e.message }))
        );
    }
    return result.data;
}
