import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = forgotPasswordSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email } = validation.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                success: true,
                message: "If an account exists, a password reset link has been sent.",
            });
        }

        // Generate reset token (20 min expiry)
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

        // Store token
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId: user.id,
                eventType: "PASSWORD_RESET_REQUESTED",
                details: {
                    email: user.email,
                    expiresAt: expiresAt.toISOString(),
                },
            },
        });

        // TODO: Send email with reset link
        // For now, log to console
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        console.log(`
========================================
PASSWORD RESET LINK
----------------------------------------
Email: ${user.email}
Token: ${token}
Expires: ${expiresAt.toLocaleString()}
URL: ${resetUrl}
========================================
        `);

        return NextResponse.json({
            success: true,
            message: "If an account exists, a password reset link has been sent.",
            // Include token in dev mode for testing
            ...(process.env.NODE_ENV !== "production" && { _devToken: token }),
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
