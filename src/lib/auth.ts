import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const secretKey = process.env.JWT_SECRET || "default_secret_key_change_me";
const key = new TextEncoder().encode(secretKey);

// Password policy: >= 8 chars, uppercase, lowercase, number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Account locking config
export const LOCK_CONFIG = {
    maxAttempts: 10,
    lockDurationMs: 5 * 60 * 1000, // 5 minutes
};

// Role types matching Prisma enum
export type RoleKey = "ADMIN" | "INSTRUCTOR" | "SUPER_INSTRUCTOR" | "LEARNER";

// Session payload type
export interface SessionPayload {
    userId: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    roles: RoleKey[];
    activeRole: RoleKey;
    exp?: number;
}

// ============= JWT Functions =============

export async function encrypt(payload: SessionPayload) {
    return await new SignJWT(payload as any)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function setSession(payload: SessionPayload) {
    const session = await encrypt(payload);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const cookieStore = await cookies();
    cookieStore.set("session", session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        path: '/'
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.set("session", "", { expires: new Date(0), path: '/' });
}

// ============= Password Functions =============

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters" };
    }
    if (!PASSWORD_REGEX.test(password)) {
        return {
            valid: false,
            error: "Password must contain uppercase, lowercase, and a number"
        };
    }
    return { valid: true };
}

// ============= Auth Guard Functions =============

export class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number = 401) {
        super(message);
        this.name = "AuthError";
        this.statusCode = statusCode;
    }
}

/**
 * Require user to be authenticated.
 * Throws AuthError if not authenticated.
 */
export async function requireAuth(): Promise<SessionPayload> {
    const session = await getSession();
    if (!session) {
        throw new AuthError("Not authenticated", 401);
    }
    return session;
}

/**
 * Require user to have one of the specified roles.
 * Throws AuthError if user doesn't have required role.
 */
export async function requireRole(allowedRoles: RoleKey[]): Promise<SessionPayload> {
    const session = await requireAuth();

    // Check if user's active role is in allowed roles
    if (!allowedRoles.includes(session.activeRole)) {
        throw new AuthError("Insufficient permissions", 403);
    }

    return session;
}

/**
 * Require user to be an admin
 */
export async function requireAdmin(): Promise<SessionPayload> {
    return requireRole(["ADMIN"]);
}

/**
 * Require user to be admin or instructor
 */
export async function requireInstructor(): Promise<SessionPayload> {
    return requireRole(["ADMIN", "INSTRUCTOR"]);
}

// ============= Session Refresh (for middleware) =============

export async function updateSession(request: Request) {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) return null;

    const session = await decrypt(sessionMatch[1]);
    if (!session) return null;

    // Refresh the session
    const newToken = await encrypt(session);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: newToken,
        httpOnly: true,
        expires,
        path: '/',
        secure: process.env.NODE_ENV === "production",
    });

    return res;
}

// Legacy exports for backwards compatibility
export const login = setSession;
export const logout = clearSession;
