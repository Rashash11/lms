import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_me";
const JWT_KEY = new TextEncoder().encode(JWT_SECRET);
const JWT_ISSUER = "lms-auth";
const JWT_AUDIENCE = "lms-api";
const ACCESS_TOKEN_EXPIRY = "15m";

export type RoleKey = "ADMIN" | "INSTRUCTOR" | "SUPER_INSTRUCTOR" | "LEARNER";

export interface AuthContext {
    userId: string;
    email: string;
    role: RoleKey;
    nodeId?: number;
    tokenVersion?: number;
}

export interface JWTPayload extends AuthContext {
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}

export class AuthError extends Error {
    constructor(message: string, public statusCode: number = 401) {
        super(message);
        this.name = "AuthError";
    }
}

export async function signAccessToken(payload: AuthContext): Promise<string> {
    return await new SignJWT(payload as any)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .sign(JWT_KEY);
}

/**
 * Lightweight token verification for middleware - no DB check, only JWT signature validation
 * Use this in middleware for performance
 */
export async function verifyAccessTokenLight(token: string): Promise<JWTPayload> {
    try {
        const { payload } = await jwtVerify(token, JWT_KEY, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        return payload as JWTPayload;
    } catch (err) {
        throw new AuthError("Invalid or expired token", 401);
    }
}

/**
 * Full token verification with tokenVersion validation
 * Use this in API routes for security
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
        const { payload } = await jwtVerify(token, JWT_KEY, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        const jwtPayload = payload as JWTPayload;

        // Normalize: JWT tokenVersion defaults to 0 if undefined/null
        const jwtTokenVersion = jwtPayload.tokenVersion ?? 0;

        // Use raw SQL to read token_version (Prisma client may not be regenerated yet)
        const result = await prisma.$queryRaw<[{ token_version: number | null }]>`
            SELECT token_version FROM users WHERE id = ${jwtPayload.userId}
        `;

        if (!result || result.length === 0) {
            throw new AuthError("User not found", 401);
        }

        // Normalize: DB tokenVersion defaults to 0 if NULL
        const dbTokenVersion = result[0]?.token_version ?? 0;

        // Only reject if there's an explicit mismatch between normalized values
        if (jwtTokenVersion !== dbTokenVersion) {
            throw new AuthError("Token has been revoked", 401);
        }

        return jwtPayload;
    } catch (err) {
        if (err instanceof AuthError) throw err;
        throw new AuthError("Invalid or expired token", 401);
    }
}

export async function getAuthContext(): Promise<AuthContext | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
        return null;
    }

    try {
        const claims = await verifyAccessToken(sessionCookie.value);
        return {
            userId: claims.userId,
            email: claims.email,
            role: claims.role,
            nodeId: claims.nodeId,
            tokenVersion: claims.tokenVersion,
        };
    } catch {
        return null;
    }
}

export async function requireAuth(): Promise<AuthContext> {
    const context = await getAuthContext();
    if (!context) {
        throw new AuthError("Authentication required", 401);
    }
    return context;
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
