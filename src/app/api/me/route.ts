export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthContext, requireAuth, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getAuthContext();

        if (!session) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: "Authentication required" },
                { status: 401 }
            );
        }

        // Use raw SQL to avoid Prisma field mapping issues
        const users = await prisma.$queryRaw<Array<{
            id: string;
            email: string;
            username: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
            status: string;
            activeRole: string;
            lastLoginAt: Date | null;
            is_active: boolean;
            is_verified: boolean;
        }>>`
            SELECT id, email, username, "firstName", "lastName", avatar, status, 
                   "activeRole", "lastLoginAt", is_active, is_verified
            FROM users 
            WHERE id = ${session.userId}
        `;

        const user = users[0];

        if (!user) {
            return NextResponse.json(
                { error: "NOT_FOUND", message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                status: user.status,
                role: user.activeRole,
                activeRole: user.activeRole, // For backward compatibility
                isActive: user.is_active,
                isVerified: user.is_verified,
                lastLoginAt: user.lastLoginAt,
            },
        });

    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: error.message },
                { status: error.statusCode }
            );
        }
        console.error("Get me error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Failed to fetch user data" },
            { status: 500 }
        );
    }
}
