import { NextRequest, NextResponse } from "next/server";
import { requireAuth, signAccessToken, AuthError } from "@/lib/auth";
import { RateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const switchNodeLimiter = new RateLimiter(60 * 1000, 10); // 10 per minute

const switchNodeSchema = z.object({
    nodeId: z.union([z.string(), z.number()]).transform(v => String(v))
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        let context;
        try {
            context = await requireAuth();
        } catch (authErr: any) {
            console.error("[SWITCH_NODE] Auth failed:", authErr.message);
            throw authErr;
        }

        // Rate limiting by userId
        if (!switchNodeLimiter.check(context.userId)) {
            const retryAfter = switchNodeLimiter.getRetryAfter(context.userId);
            return NextResponse.json(
                { error: "TOO_MANY_REQUESTS", message: "Too many switch-node attempts. Try again later." },
                { status: 429, headers: { "Retry-After": retryAfter.toString() } }
            );
        }

        const body = await request.json();
        const validation = switchNodeSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: "Invalid nodeId" },
                { status: 400 }
            );
        }
        
        const nodeIdStr = validation.data.nodeId;

        // 1. Validate node exists (check branches table with UUID)
        let nodeExists;
        try {
            nodeExists = await prisma.branch.findUnique({
                where: { id: nodeIdStr },
                select: { id: true, tenantId: true, isActive: true },
            });
        } catch (dbErr: any) {
            console.error("[SWITCH_NODE] DB Error during node lookup:", dbErr.message);
            throw dbErr;
        }

        if (!nodeExists) {
            return NextResponse.json(
                { error: "NOT_FOUND", message: "Node not found" },
                { status: 404 }
            );
        }

        if (!nodeExists.isActive) {
            return NextResponse.json(
                { error: "FORBIDDEN", message: "Node is inactive" },
                { status: 403 }
            );
        }

        // 2. Authorization check
        // ADMIN (tenant-global): can switch to any node
        // Non-ADMIN: must have explicit assignment to the node (user.nodeId matches)
        if (context.role !== "ADMIN") {
            try {
                const userNode = await prisma.user.findFirst({
                    where: { id: context.userId },
                    select: { nodeId: true },
                });

                if (userNode?.nodeId !== nodeIdStr) {
                    return NextResponse.json(
                        { error: "FORBIDDEN", message: "No access to this node" },
                        { status: 403 }
                    );
                }
            } catch (dbErr: any) {
                console.error("[SWITCH_NODE] DB Error during user node check:", dbErr.message);
                throw dbErr;
            }
        }

        // 3. Create new token with updated nodeId
        console.log("[SWITCH_NODE] Signing new access token");
        const token = await signAccessToken({
            userId: context.userId,
            email: context.email,
            activeRole: context.activeRole,
            tenantId: context.tenantId, // IMPORTANT: Preserve tenantId
            nodeId: nodeIdStr || undefined,
            tokenVersion: context.tokenVersion,
        });

        const response = NextResponse.json({
            ok: true,
            nodeId: nodeIdStr,
        });

        response.cookies.set("session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 15 * 60,
        });

        console.log("[SWITCH_NODE] Switch successful");
        return response;
    } catch (error: any) {
        console.error("[SWITCH_NODE] Unhandled error:", error);
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Failed to switch node: " + (error.message || "Unknown error") },
            { status: 500 }
        );
    }
}
