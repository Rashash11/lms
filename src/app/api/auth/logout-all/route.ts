import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuthAudit, getClientIp, getClientUserAgent } from "@/lib/audit-logger";

/**
 * Global logout - invalidates all tokens by incrementing tokenVersion
 * This forces re-authentication on all devices
 */
export async function POST(request: Request) {
    try {
        const context = await requireAuth();

        // Increment tokenVersion to invalidate all existing tokens
        await prisma.$executeRaw`
            UPDATE users 
            SET token_version = COALESCE(token_version, 0) + 1 
            WHERE id = ${context.userId}
        `;

        await logAuthAudit({
            eventType: "LOGOUT_ALL",
            userId: context.userId,
            ip: getClientIp(request.headers as Headers),
            userAgent: getClientUserAgent(request.headers as Headers),
        });

        const response = NextResponse.json({
            ok: true,
            message: "All sessions invalidated"
        });

        // Clear current session cookie
        response.cookies.delete("session");

        return response;
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: error.message },
                { status: error.statusCode }
            );
        }

        console.error("Logout-all error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Failed to invalidate sessions" },
            { status: 500 }
        );
    }
}
