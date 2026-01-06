import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logAuthAudit, getClientIp, getClientUserAgent } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
    try {
        const context = await requireAuth();

        await logAuthAudit({
            eventType: "LOGOUT",
            userId: context.userId,
            ip: getClientIp(request.headers),
            userAgent: getClientUserAgent(request.headers),
        });
    } catch {
        // Ignore auth errors - allow logout even if token expired
    }

    const response = NextResponse.json({ ok: true });

    // Properly clear the session cookie with explicit expiry
    response.cookies.set("session", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0, // Critical: Set to 0 to clear
        expires: new Date(0) // Also set expires for maximum browser compatibility
    });

    return response;
}
