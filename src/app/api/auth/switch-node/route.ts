import { NextRequest, NextResponse } from "next/server";
import { requireAuth, signAccessToken, AuthError } from "@/lib/auth";
import { RateLimiter } from "@/lib/rate-limit";

const switchNodeLimiter = new RateLimiter(60 * 1000, 10); // 10 per minute

export async function POST(request: NextRequest) {
    try {
        const context = await requireAuth();

        // Rate limiting by userId
        if (!switchNodeLimiter.check(context.userId)) {
            const retryAfter = switchNodeLimiter.getRetryAfter(context.userId);
            return NextResponse.json(
                { error: "TOO_MANY_REQUESTS", message: "Too many switch-node attempts. Try again later." },
                { status: 429, headers: { "Retry-After": retryAfter.toString() } }
            );
        }

        const body = await request.json();
        const { nodeId } = body;

        if (typeof nodeId !== "number") {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: "nodeId must be a number" },
                { status: 400 }
            );
        }

        // TODO: Add proper node access validation
        // For now, only ADMIN can switch nodes
        if (context.role !== "ADMIN") {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Only admins can switch nodes" },
                { status: 403 }
            );
        }

        const token = await signAccessToken({
            userId: context.userId,
            email: context.email,
            role: context.role,
            nodeId,
        });

        const response = NextResponse.json({
            ok: true,
            nodeId,
        });

        response.cookies.set("session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 15 * 60,
        });

        return response;
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: error.message },
                { status: error.statusCode }
            );
        }

        console.error("Switch node error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Failed to switch node" },
            { status: 500 }
        );
    }
}
