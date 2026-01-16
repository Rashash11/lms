import { NextRequest, NextResponse } from "next/server";
import { getUnscopedPrisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, comparePassword, RoleKey } from "@/lib/auth";
import { loginLimiter } from "@/lib/rate-limit";
import { logAuthAudit, getClientIp, getClientUserAgent } from "@/lib/audit-logger";
import { logger } from "@/lib/logger";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const prisma = getUnscopedPrisma();
    try {
        const body = await request.json();

        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        // Get IP for rate limiting and audit
        const ip = getClientIp(request.headers);
        const userAgent = getClientUserAgent(request.headers);
        const rateLimitKey = `${ip}:${email}`;

        if (!loginLimiter.check(rateLimitKey)) {
            const retryAfter = loginLimiter.getRetryAfter(rateLimitKey);
            return NextResponse.json(
                { error: "TOO_MANY_REQUESTS", message: "Too many login attempts. Try again later." },
                {
                    status: 429,
                    headers: { "Retry-After": retryAfter.toString() }
                }
            );
        }

        let user;
        try {
            user = await prisma.user.findFirst({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    passwordHash: true,
                    activeRole: true,
                    isActive: true,
                    isVerified: true,
                    tenantId: true,
                    tokenVersion: true,
                    nodeId: true,
                }
            });
        } catch (dbError: any) {
            logger.error("Login prisma query failed", dbError);
            throw dbError;
        }

        if (!user || !user.passwordHash) {
            await logAuthAudit({
                eventType: "LOGIN_FAIL",
                ip,
                userAgent,
                metadata: { email, reason: "invalid_credentials" },
            });
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: "Invalid email or password" },
                { status: 401 }
            );
        }

        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
            await logAuthAudit({
                eventType: "LOGIN_FAIL",
                tenantId: user.tenantId,
                userId: user.id,
                ip,
                userAgent,
                metadata: { email, reason: "invalid_password" },
            });
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: "Invalid email or password" },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Account is disabled" },
                { status: 403 }
            );
        }

        const requireVerified = process.env.REQUIRE_VERIFIED === "true";
        if (requireVerified && !user.isVerified) {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Email not verified" },
                { status: 403 }
            );
        }

        await prisma.user.update({
            where: { tenantId_id: { tenantId: user.tenantId, id: user.id } },
            data: { lastLoginAt: new Date() },
        });

        const token = await signAccessToken({
            userId: user.id,
            email: user.email,
            activeRole: user.activeRole as RoleKey,
            tenantId: user.tenantId || undefined,
            tokenVersion: user.tokenVersion,
            nodeId: user.nodeId || undefined,
        });

        const refreshToken = await signRefreshToken(user.id, user.tokenVersion);

        await logAuthAudit({
            eventType: "LOGIN_SUCCESS",
            tenantId: user.tenantId,
            userId: user.id,
            ip,
            userAgent,
            metadata: { email },
        });

        const fullUser = await prisma.user.findUnique({
            where: { tenantId_id: { tenantId: user.tenantId, id: user.id } },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                activeRole: true,
            }
        });

        if (!fullUser) {
            throw new Error("User data inconsistent after login");
        }

        const loginResponse: import("@/lib/auth").LoginResponse = {
            ok: true,
            userId: user.id,
            activeRole: user.activeRole as import("@/lib/auth").RoleKey,
            user: {
                id: fullUser.id,
                email: fullUser.email,
                username: fullUser.username,
                firstName: fullUser.firstName,
                lastName: fullUser.lastName,
                avatar: fullUser.avatar,
                activeRole: fullUser.activeRole as import("@/lib/auth").RoleKey,
            },
        };

        const response = NextResponse.json(loginResponse);

        const { setAuthCookiesOnResponse } = await import("@/lib/auth");
        setAuthCookiesOnResponse(response, token, refreshToken);

        return response;
    } catch (error: any) {
        logger.error("Login error", error);
        const message = process.env.NODE_ENV === "production"
            ? "Login failed"
            : `Login failed: ${error?.message || "Unknown error"}`;
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message },
            { status: 500 }
        );
    }
}
