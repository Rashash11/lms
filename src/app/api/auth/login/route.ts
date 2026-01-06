import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, comparePassword, RoleKey } from "@/lib/auth";
import { loginLimiter } from "@/lib/rate-limit";
import { logAuthAudit, getClientIp, getClientUserAgent } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: "Email and password required" },
                { status: 400 }
            );
        }

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

        // Use raw SQL to avoid Prisma field mapping issues
        const users = await prisma.$queryRaw<Array<{
            id: string;
            email: string;
            passwordHash: string | null;
            activeRole: string;
            is_active: boolean;
            is_verified: boolean;
        }>>`
            SELECT id, email, "passwordHash", "activeRole", is_active, is_verified
            FROM users 
            WHERE email = ${email}
        `;

        const user = users[0];

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

        if (!user.is_active) {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Account is disabled" },
                { status: 403 }
            );
        }

        const requireVerified = process.env.REQUIRE_VERIFIED === "true";
        if (requireVerified && !user.is_verified) {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Email not verified" },
                { status: 403 }
            );
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Get tokenVersion for token invalidation (use raw SQL for reliability)
        const tokenVersionResult = await prisma.$queryRaw<[{ token_version: number | null }]>`
            SELECT token_version FROM users WHERE id = ${user.id}
        `;
        const userTokenVersion = tokenVersionResult[0]?.token_version ?? 0;

        const token = await signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.activeRole as RoleKey,
            tokenVersion: userTokenVersion,
        });

        await logAuthAudit({
            eventType: "LOGIN_SUCCESS",
            userId: user.id,
            ip,
            userAgent,
            metadata: { email },
        });

        const response = NextResponse.json({
            ok: true,
            userId: user.id,
            role: user.activeRole,
        });

        response.cookies.set("session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 15 * 60, // 15 minutes
        });

        return response;
    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Login failed" },
            { status: 500 }
        );
    }
}
