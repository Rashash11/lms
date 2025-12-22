import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    setSession,
    verifyPassword,
    LOCK_CONFIG,
    RoleKey,
    SessionPayload
} from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        // Find user with roles
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { roles: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Check if account is locked
        if (user.status === "LOCKED" || (user.lockedUntil && new Date(user.lockedUntil) > new Date())) {
            const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil).toLocaleTimeString() : "later";
            return NextResponse.json(
                { error: `Account is locked. Try again at ${lockedUntil}` },
                { status: 423 }
            );
        }

        // Check if user is inactive
        if (user.status === "INACTIVE" || user.status === "DEACTIVATED") {
            return NextResponse.json(
                { error: "Account is deactivated. Contact administrator." },
                { status: 403 }
            );
        }

        // Verify password
        if (!user.passwordHash) {
            return NextResponse.json(
                { error: "Password not set. Use password reset." },
                { status: 401 }
            );
        }

        const passwordValid = await verifyPassword(password, user.passwordHash);

        if (!passwordValid) {
            // Increment failed attempts
            const newAttempts = user.failedLoginAttempts + 1;
            const shouldLock = newAttempts >= LOCK_CONFIG.maxAttempts;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newAttempts,
                    ...(shouldLock && {
                        lockedUntil: new Date(Date.now() + LOCK_CONFIG.lockDurationMs),
                    }),
                },
            });

            if (shouldLock) {
                return NextResponse.json(
                    { error: "Too many failed attempts. Account locked for 5 minutes." },
                    { status: 423 }
                );
            }

            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Success - reset failed attempts and update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });

        // Get user roles
        const roles = user.roles.map(r => r.roleKey as RoleKey);

        // If no roles assigned, default to LEARNER
        if (roles.length === 0) {
            roles.push("LEARNER");
        }

        // Determine active role (use stored or default to first role)
        const activeRole = (user.activeRole as RoleKey) || roles[0];

        // Create session
        const sessionPayload: SessionPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            roles,
            activeRole,
        };

        await setSession(sessionPayload);

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId: user.id,
                eventType: "USER_LOGIN",
                details: {
                    email: user.email,
                    role: activeRole,
                    ip: request.headers.get("x-forwarded-for") || "unknown",
                },
            },
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                roles,
                activeRole,
            },
        });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "An error occurred during login" },
            { status: 500 }
        );
    }
}
