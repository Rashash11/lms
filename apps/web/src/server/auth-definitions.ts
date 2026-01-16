import { SignJWT, jwtVerify } from "jose";
import { logger } from "./logger";

export const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_me";
export const JWT_KEY = new TextEncoder().encode(JWT_SECRET);
export const JWT_ISSUER = "lms-auth";
export const JWT_AUDIENCE = "lms-api";
export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";

function ensureJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV !== "production") return;
    if (!secret || secret === "default_secret_key_change_me" || secret.length < 32) {
        throw new AuthError("Server misconfigured", 500);
    }
}

export type RoleKey = "ADMIN" | "INSTRUCTOR" | "SUPER_INSTRUCTOR" | "LEARNER";

export interface AuthContext {
    userId: string;
    email: string;
    activeRole: RoleKey;
    role?: RoleKey;  // Alias for backward compatibility
    tenantId?: string;
    nodeId?: string;
    tokenVersion?: number;
    isImpersonated?: boolean;
    adminId?: string;
}

export interface SessionPayload {
    userId: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    roles: RoleKey[];
    activeRole: RoleKey;
    tenantId?: string;
    tokenVersion?: number;
    isImpersonated?: boolean;
    adminId?: string;
}

export interface LoginResponse {
    ok: boolean;
    userId: string;
    activeRole: RoleKey;
    user: {
        id: string;
        email: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        activeRole: RoleKey;
    };
    diagnostics?: string;
    error?: string;
    message?: string;
}

export interface CustomJWTPayload extends AuthContext {
    iat: number;
    exp: number;
    iss: string;
    aud: string;
    jti?: string; // Unique token ID for replay attack prevention
}

export class AuthError extends Error {
    constructor(message: string, public statusCode: number = 401) {
        super(message);
        this.name = "AuthError";
    }
}

/**
 * Lightweight token verification for middleware - no DB check, only JWT signature validation
 * Use this in middleware for performance
 */
export async function verifyAccessTokenLight(token: string): Promise<CustomJWTPayload> {
    try {
        ensureJwtSecret();
        const { payload } = await jwtVerify(token, JWT_KEY, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        return payload as unknown as CustomJWTPayload;
    } catch (err) {
        logger.error('JWT Verify Error:', err);
        throw new AuthError("Invalid or expired token", 401);
    }
}

export async function signAccessToken(payload: AuthContext): Promise<string> {
    ensureJwtSecret();
    const jti = crypto.randomUUID(); // Unique token ID for each access token
    return await new SignJWT(payload as any)
        .setProtectedHeader({ alg: "HS256" })
        .setJti(jti)
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .sign(JWT_KEY);
}
