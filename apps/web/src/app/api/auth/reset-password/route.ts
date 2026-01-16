import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordPolicy } from "@/lib/auth";
import { z } from "zod";

const resetPasswordSchema = z.object({
    token: z.string().uuid("Invalid token format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = resetPasswordSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { token, password } = validation.data;

        // Validate password policy
        const policyCheck = validatePasswordPolicy(password);
        if (!policyCheck.valid) {
            return NextResponse.json(
                { error: policyCheck.error },
                { status: 400 }
            );
        }

        // Find valid token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: "Invalid or expired reset link" },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date(resetToken.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Reset link has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Check if token was already used
        if (resetToken.usedAt) {
            return NextResponse.json(
                { error: "This reset link has already been used" },
                { status: 400 }
            );
        }

        // Hash new password
        const passwordHash = await hashPassword(password);

        // Update user password and mark token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: {
                    passwordHash,
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                tenantId: resetToken.user.tenantId,
                userId: resetToken.userId,
                eventType: "PASSWORD_RESET_COMPLETED",
                details: {
                    tokenId: resetToken.id,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Password has been reset. You can now login.",
        });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
