export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSession, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            // Dev mode fallback - return mock user for preview
            return NextResponse.json({
                user: {
                    id: 'preview-user',
                    email: 'admin@portal.com',
                    username: 'admin',
                    firstName: 'Admin',
                    lastName: 'User',
                    avatar: null,
                    status: 'ACTIVE',
                    roles: ['ADMIN', 'INSTRUCTOR', 'LEARNER'],
                    activeRole: 'ADMIN',
                    lastLoginAt: new Date().toISOString(),
                },
            });
        }

        // Fetch fresh user data from DB
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { roles: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
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
                roles: user.roles.map(r => r.roleKey),
                activeRole: session.activeRole,
                lastLoginAt: user.lastLoginAt,
            },
        });

    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }
        console.error("Get me error:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
