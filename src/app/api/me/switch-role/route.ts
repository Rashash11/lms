import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    getSession,
    setSession,
    RoleKey,
    SessionPayload
} from "@/lib/auth";
import { z } from "zod";

const switchRoleSchema = z.object({
    role: z.enum(["ADMIN", "INSTRUCTOR", "LEARNER", "SUPER_INSTRUCTOR"]),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        // Dev mode fallback - allow role switching in preview mode
        if (!session) {
            const body = await request.json();
            const validation = switchRoleSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json(
                    { error: "Invalid role" },
                    { status: 400 }
                );
            }

            const { role } = validation.data;

            // In dev preview mode, just return success with redirect URL
            let redirectUrl = "/learner";
            if (role === "ADMIN") {
                redirectUrl = "/admin";
            } else if (role === "SUPER_INSTRUCTOR") {
                redirectUrl = "/super-instructor";
            } else if (role === "INSTRUCTOR") {
                redirectUrl = "/instructor";
            }

            return NextResponse.json({
                success: true,
                activeRole: role,
                redirectUrl,
            });
        }

        const body = await request.json();

        // Validate input
        const validation = switchRoleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        const { role } = validation.data;

        // Verify user has this role
        if (!session.roles.includes(role as RoleKey)) {
            return NextResponse.json(
                { error: "You don't have permission for this role" },
                { status: 403 }
            );
        }

        // Update user's active role in DB
        await prisma.user.update({
            where: { id: session.userId },
            data: { activeRole: role as any },
        });

        // Update session with new active role
        const newSession: SessionPayload = {
            ...session,
            activeRole: role as any,
        };

        await setSession(newSession);

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId: session.userId,
                eventType: "ROLE_SWITCH",
                details: {
                    fromRole: session.activeRole,
                    toRole: role,
                },
            },
        });

        // Determine redirect URL based on role
        let redirectUrl = "/learner";
        if (role === "ADMIN") {
            redirectUrl = "/admin";
        } else if (role === "SUPER_INSTRUCTOR") {
            redirectUrl = "/super-instructor";
        } else if (role === "INSTRUCTOR") {
            redirectUrl = "/instructor";
        }

        return NextResponse.json({
            success: true,
            activeRole: role,
            redirectUrl,
        });

    } catch (error) {
        console.error("Switch role error:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
