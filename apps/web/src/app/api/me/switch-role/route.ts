import { withGuard } from '@/lib/api-guard';
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
    activeRole: z.enum(["ADMIN", "INSTRUCTOR", "LEARNER", "SUPER_INSTRUCTOR"]),
});

const POST_handler = async (request: NextRequest) => {
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

            const { activeRole } = validation.data;

            // In dev preview mode, just return success with redirect URL
            let redirectUrl = "/learner";
            if (activeRole === "ADMIN") {
                redirectUrl = "/admin";
            } else if (activeRole === "SUPER_INSTRUCTOR") {
                redirectUrl = "/super-instructor";
            } else if (activeRole === "INSTRUCTOR") {
                redirectUrl = "/instructor";
            }

            return NextResponse.json({
                success: true,
                activeRole: activeRole,
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

        const { activeRole } = validation.data;

        // Verify user has this role
        if (!session.roles.includes(activeRole as RoleKey)) {
            return NextResponse.json(
                { error: "You don't have permission for this role" },
                { status: 403 }
            );
        }

        // Update user's active role in DB
        await prisma.user.update({
            where: {
                tenantId_id: {
                    tenantId: session.tenantId!,
                    id: session.userId
                }
            },
            data: { activeRole: activeRole as any },
        });

        // Update session with new active role
        const newSession: SessionPayload = {
            ...session,
            activeRole: activeRole as any,
        };

        await setSession(newSession);

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                tenantId: session.tenantId!,
                userId: session.userId,
                eventType: "ROLE_SWITCH",
                details: {
                    fromRole: session.activeRole,
                    toRole: activeRole,
                },
            },
        });

        // Determine redirect URL based on role
        let redirectUrl = "/learner";
        if (activeRole === "ADMIN") {
            redirectUrl = "/admin";
        } else if (activeRole === "SUPER_INSTRUCTOR") {
            redirectUrl = "/super-instructor";
        } else if (activeRole === "INSTRUCTOR") {
            redirectUrl = "/instructor";
        }

        return NextResponse.json({
            success: true,
            activeRole: activeRole,
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
export async function POST(request: NextRequest) {
    return withGuard(request, {}, () => POST_handler(request));
}
