import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    rotateRefreshToken,
    generateAccessToken,
    setAuthCookiesOnResponse,
    clearAuthCookiesOnResponse,
    logAuditEvent,
    RoleKey,
} from "@/lib/auth";
import { refreshLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Rate Limiting
    const limitKey = `refresh:${ip}`;
    const skipRateLimit = process.env.NODE_ENV !== 'production' && request.headers.get('x-lms-skip-rate-limit') === '1';

    if (!skipRateLimit && !refreshLimiter.check(limitKey)) {
        await logAuditEvent("REFRESH_FAILED", null, { ip, userAgent, reason: "rate_limit_exceeded" });
        const retryAfter = refreshLimiter.getRetryAfter(limitKey);

        return NextResponse.json(
            { error: "Too many requests", retryAfterSeconds: retryAfter },
            {
                status: 429,
                headers: {
                    "Retry-After": String(retryAfter)
                }
            }
        );
    }

    try {
        // Get refresh token from cookie
        const refreshToken = request.cookies.get("refreshToken")?.value;

        if (!refreshToken) {
            await logAuditEvent("REFRESH_FAILED", null, { ip, userAgent, reason: "no_token" });
            const response = NextResponse.json(
                { ok: false, error: "No refresh token provided" },
                { status: 401 }
            );
            clearAuthCookiesOnResponse(response);
            return response;
        }

        // Rotate the refresh token
        const rotationResult = await rotateRefreshToken(refreshToken, { ip, userAgent });

        if (!rotationResult) {
            await logAuditEvent("REFRESH_FAILED", null, { ip, userAgent, reason: "invalid_or_expired" });
            const response = NextResponse.json(
                { ok: false, error: "Invalid or expired refresh token" },
                { status: 401 }
            );
            clearAuthCookiesOnResponse(response);
            return response;
        }

        const { newRefreshToken, userId } = rotationResult;

        // Load user for new access token
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { roles: true },
        });

        if (!user || user.status !== "ACTIVE") {
            await logAuditEvent("REFRESH_FAILED", userId, { ip, userAgent, reason: "user_inactive" });
            const response = NextResponse.json(
                { ok: false, error: "User account is not active" },
                { status: 401 }
            );
            clearAuthCookiesOnResponse(response);
            return response;
        }

        // Get user roles
        const roles = user.roles.map(r => r.roleKey as RoleKey);
        if (roles.length === 0) {
            roles.push("LEARNER");
        }

        const activeRole = (user.activeRole as RoleKey) || roles[0];

        // Generate new access token
        const accessToken = await generateAccessToken({
            userId: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            roles,
            activeRole,
            tokenVersion: user.tokenVersion,
        });

        await logAuditEvent("REFRESH_ROTATED", userId, { ip, userAgent });

        // Create response with new cookies
        const response = NextResponse.json({
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            roles,
            activeRole,
        });

        setAuthCookiesOnResponse(response, accessToken, newRefreshToken);

        return response;

    } catch (error) {
        console.error("Refresh token error:", error);
        await logAuditEvent("REFRESH_FAILED", null, { ip, userAgent, reason: "server_error" });
        const response = NextResponse.json(
            { ok: false, error: "An error occurred during token refresh" },
            { status: 500 }
        );
        clearAuthCookiesOnResponse(response);
        return response;
    }
}
