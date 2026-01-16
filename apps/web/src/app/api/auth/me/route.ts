import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const context = await requireAuth();

        const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                activeRole: true,
                isActive: true,
                isVerified: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "NOT_FOUND", message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            claims: {
                userId: context.userId,
                email: context.email,
                roles: [context.role], // array of roles
                activeRole: context.role,
                tenantId: context.tenantId,
                nodeId: context.nodeId,
                ver: context.tokenVersion ?? 0,
                exp: Math.floor(Date.now() / 1000) + 900, // 15 min from now
                iss: 'lms-auth',
                aud: 'lms-api',
            },
            user,
        });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: error.message },
                { status: error.statusCode }
            );
        }

        console.error("Me endpoint error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Failed to get user" },
            { status: 500 }
        );
    }
}
