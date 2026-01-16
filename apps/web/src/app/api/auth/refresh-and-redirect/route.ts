import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {

    rotateRefreshToken,
    generateAccessToken,
    setAuthCookiesOnResponse,
    clearAuthCookiesOnResponse,
    RoleKey,
} from "@/lib/auth";

/**
 * GET /api/auth/refresh-and-redirect
 * 
 * This endpoint handles automatic token refresh and redirects the user back to
 * their original destination. It's called by middleware when the access token
 * has expired but a valid refresh token exists.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';
    const refreshCookie = request.cookies.get('refreshToken')?.value;

    if (!refreshCookie) {
        // No refresh token - redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', redirectTo);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") || "unknown";
        const userAgent = request.headers.get("user-agent") || undefined;

        // Try to rotate the refresh token
        const rotationResult = await rotateRefreshToken(refreshCookie, { ip, userAgent });

        if (!rotationResult) {
            // Refresh token is invalid or expired - redirect to login
            const response = NextResponse.redirect(new URL('/login?session=expired', request.url));
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
            const response = NextResponse.redirect(new URL('/login?session=inactive', request.url));
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

        // Create redirect response with new cookies
        const response = NextResponse.redirect(new URL(redirectTo, request.url));
        setAuthCookiesOnResponse(response, accessToken, newRefreshToken);

        return response;

    } catch (error) {
        console.error("Refresh-and-redirect error:", error);
        const response = NextResponse.redirect(new URL('/login?session=error', request.url));
        clearAuthCookiesOnResponse(response);
        return response;
    }
}
