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

    // Properly clear authentication cookies
    response.cookies.delete("session");
    response.cookies.delete("refreshToken");

    return response;
}
