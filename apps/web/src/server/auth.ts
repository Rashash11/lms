import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAuthAudit } from "@/lib/audit-logger";
import {
    JWT_KEY,
    JWT_ISSUER,
    JWT_AUDIENCE,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
    RoleKey,
    AuthContext,
    SessionPayload,
    CustomJWTPayload,
    AuthError,
    verifyAccessTokenLight,
    signAccessToken
} from "./auth-definitions";

export * from "./auth-definitions";

/**
 * Full token verification with tokenVersion validation
 * Use this in API routes for security
 */
export async function verifyAccessToken(token: string): Promise<CustomJWTPayload> {
    try {
        const { payload } = await jwtVerify(token, JWT_KEY, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        const jwtPayload = payload as unknown as CustomJWTPayload;

        // Normalize: JWT tokenVersion defaults to 0 if undefined/null
        const jwtTokenVersion = jwtPayload.tokenVersion ?? 0;

        // Use Prisma client
        const user = await prisma.user.findUnique({
            where: { id: jwtPayload.userId },
            select: { tokenVersion: true, tenantId: true }
        });

        if (!user) {
            console.error("User not found during token verification:", {
                userId: jwtPayload.userId,
                jwtTenantId: jwtPayload.tenantId,
                email: jwtPayload.email
            });
            throw new AuthError("User not found", 401);
        }

        const dbTokenVersion = user.tokenVersion ?? 0;

        // Only reject if there's an explicit mismatch between normalized values
        if (jwtTokenVersion !== dbTokenVersion) {
            console.error("Token version mismatch. JWT:", jwtTokenVersion, "DB:", dbTokenVersion);
            throw new AuthError("Token has been revoked", 401);
        }

        return jwtPayload;
    } catch (err) {
        if (err instanceof AuthError) {
            if (process.env.AUTH_DEBUG === '1') {
                console.error(`[AUTH_DEBUG] verifyAccessToken failed: ${err.message} (${err.statusCode})`);
            }
            throw err;
        }
        if (process.env.AUTH_DEBUG === '1') {
            console.error("[AUTH_DEBUG] Token verification failed with unexpected error:", err);
        }
        throw new AuthError("Invalid or expired token", 401);
    }
}

export async function getAuthContext(): Promise<AuthContext | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
        if (process.env.AUTH_DEBUG === '1') {
            console.warn("[AUTH_DEBUG] No session cookie found");
        }
        return null;
    }

    try {
        const claims = await verifyAccessToken(sessionCookie.value);
        return {
            userId: claims.userId,
            email: claims.email,
            activeRole: claims.activeRole,
            role: claims.activeRole,  // Alias for backward compatibility
            tenantId: claims.tenantId,
            nodeId: claims.nodeId,
            tokenVersion: claims.tokenVersion,
        };
    } catch (e) {
        console.error("getAuthContext failed:", e);
        return null;
    }
}

export async function signRefreshToken(userId: string, tokenVersion: number = 0): Promise<string> {
    const jti = crypto.randomUUID(); // Unique JWT ID for each token
    return await new SignJWT({ userId, tokenVersion })
        .setProtectedHeader({ alg: "HS256" })
        .setJti(jti)
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .sign(JWT_KEY);
}

export async function requireAuth(): Promise<AuthContext> {
    const context = await getAuthContext();
    if (!context) {
        if (process.env.AUTH_DEBUG === '1') {
            console.error("[AUTH_DEBUG] requireAuth failed: Context is null");
        }
        throw new AuthError("Authentication required", 401);
    }
    return context;
}

// ===== Node Scoping Helpers =====

/**
 * Get the node ID from context, throwing 403 if missing for non-ADMIN users.
 * ADMIN users can operate without node scope (tenant-global access).
 * 
 * @returns nodeId if present, null if ADMIN without scope
 * @throws AuthError 403 if non-ADMIN and no nodeId
 */
export function requireNodeScope(context: AuthContext): string | null {
    if (context.activeRole === 'ADMIN') {
        // ADMIN is tenant-global: nodeId is optional
        return context.nodeId !== undefined ? String(context.nodeId) : null;
    }
    if (!context.nodeId) {
        throw new AuthError("Node scope required for this operation", 403);
    }
    return String(context.nodeId);
}

/**
 * Apply node scope filter to a Prisma where clause.
 * ADMIN and SUPER_INSTRUCTOR users bypass node filtering (tenant-global access).
 * Other users are restricted to their assigned node.
 * 
 * @param context - Auth context from requireAuth()
 * @param where - Existing Prisma where clause
 * @param nodeField - Field name for node filtering (default: 'nodeId')
 * @returns Modified where clause with node filter applied
 */
export function enforceNodeWhere<T extends Record<string, any>>(
    context: AuthContext,
    where: T,
    nodeField: string = 'nodeId'
): T {
    // ADMIN or SUPER_INSTRUCTOR without explicit nodeId = tenant-global (no node filter)
    const tenantGlobalRoles: RoleKey[] = ['ADMIN', 'SUPER_INSTRUCTOR'];

    if (tenantGlobalRoles.includes(context.activeRole as RoleKey) && !context.nodeId) {
        return where;
    }

    // Non-global roles must have nodeId
    if (!context.nodeId && !tenantGlobalRoles.includes(context.activeRole as RoleKey)) {
        throw new AuthError("Node scope required", 403);
    }
    
    // Apply node filter
    if (context.nodeId) {
        return { ...where, [nodeField]: String(context.nodeId) };
    }

    return where;
}

/**
 * Check if user is a tenant-global admin (can access all nodes).
 * Use this for explicit admin checks in routes.
 */
export function isTenantGlobalAdmin(context: AuthContext): boolean {
    return context.activeRole === 'ADMIN';
}

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: "Password must contain at least one uppercase letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: "Password must contain at least one number" };
    }
    return { valid: true };
}

// ===== Session Management =====

/**
 * Get current session (alias for getAuthContext with SessionPayload return type)
 */
export async function getSession(): Promise<SessionPayload | null> {
    const authContext = await getAuthContext();
    if (!authContext) return null;

    // Fetch full user data for session payload
    const user = await prisma.user.findUnique({
        where: { id: authContext.userId },
        include: { roles: true },
    });

    if (!user) return null;

    const roles = user.roles.map(r => r.roleKey as RoleKey);
    if (roles.length === 0) roles.push("LEARNER");

    return {
        userId: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        activeRole: user.activeRole || roles[0],
        tenantId: user.tenantId || undefined,
        tokenVersion: authContext.tokenVersion,
    };
}

/**
 * Set/update session by creating a new JWT and setting it as a cookie
 */
export async function setSession(payload: SessionPayload): Promise<void> {
    const token = await signAccessToken({
        userId: payload.userId,
        email: payload.email,
        activeRole: payload.activeRole,
        tenantId: payload.tenantId,
        tokenVersion: payload.tokenVersion,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60, // 15 minutes
    });
}

// ===== Token Management =====

/**
 * Generate access token (alias for signAccessToken, compatible with SessionPayload)
 */
export async function generateAccessToken(payload: SessionPayload | AuthContext): Promise<string> {
    const authPayload: AuthContext = "activeRole" in payload
        ? {
            userId: payload.userId,
            email: payload.email,
            activeRole: payload.activeRole!,
            role: payload.activeRole!,
            tenantId: payload.tenantId,
            tokenVersion: payload.tokenVersion,
        }
        : payload;

    return await signAccessToken(authPayload);
}

/**
 * Rotate refresh token - creates new refresh token and invalidates old one
 * Validates tokenVersion against DB to properly reject invalidated tokens
 */
export async function rotateRefreshToken(
    oldToken: string,
    context: { ip?: string; userAgent?: string }
): Promise<{ newRefreshToken: string; userId: string } | null> {
    try {
        // Verify the old refresh token
        const { payload } = await jwtVerify(oldToken, JWT_KEY, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        const userId = payload.userId as string;
        const jwtTokenVersion = (payload.tokenVersion as number) ?? 0;
        if (!userId) return null;

        // Validate tokenVersion against DB to detect invalidated tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tokenVersion: true }
        });

        if (!user) {
            return null; // User not found
        }

        const dbTokenVersion = user.tokenVersion ?? 0;

        // Reject if tokenVersion has been incremented (logout-all was called)
        if (jwtTokenVersion !== dbTokenVersion) {
            return null; // Token has been revoked
        }

        // Include tokenVersion in new refresh token
        const jti = crypto.randomUUID();
        const newRefreshToken = await new SignJWT({ userId, tokenVersion: dbTokenVersion })
            .setProtectedHeader({ alg: "HS256" })
            .setJti(jti)
            .setIssuedAt()
            .setExpirationTime(REFRESH_TOKEN_EXPIRY)
            .setIssuer(JWT_ISSUER)
            .setAudience(JWT_AUDIENCE)
            .sign(JWT_KEY);

        // Log the rotation
        await logAuditEvent("REFRESH_ROTATED", userId, context);

        return { newRefreshToken, userId };
    } catch (err) {
        return null;
    }
}

// ===== Cookie Helpers =====

/**
 * Set authentication cookies on a NextResponse
 */
export function setAuthCookiesOnResponse(
    response: NextResponse,
    accessToken: string,
    refreshToken?: string
): void {
    response.cookies.set("session", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60, // 15 minutes
    });

    if (refreshToken) {
        response.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
    }

    // Set CSRF Token (readable by client JS so it can be sent in header)
    const csrfToken = crypto.randomUUID();
    response.cookies.set("csrf-token", csrfToken, {
        httpOnly: false, // Must be readable by client
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60, // 15 minutes (match session)
    });
}

/**
 * Clear all authentication cookies from a NextResponse
 */
export function clearAuthCookiesOnResponse(response: NextResponse): void {
    response.cookies.delete("session");
    response.cookies.delete("refreshToken");
}

// ===== Audit Logging =====

/**
 * Log audit event (wrapper for audit-logger)
 */
export async function logAuditEvent(
    eventType: string,
    userId?: string | null,
    metadata?: Record<string, any>
): Promise<void> {
    try {
        await logAuthAudit({
            eventType: eventType as any,
            userId: userId || undefined,
            ip: metadata?.ip,
            userAgent: metadata?.userAgent,
            metadata,
        });
    } catch (err) {
        // Fail-open: never crash on audit logging
        if (process.env.NODE_ENV !== "production") {
            console.error("Audit log failed:", err);
        }
    }
}
