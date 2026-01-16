import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function repro() {
    const email = "admin@portal.com";
    const password = "Admin123!";

    console.log(`Checking user: ${email}`);
    try {
        const user = await prisma.user.findFirst({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                role: true,
                isActive: true,
                tenantId: true,
                tokenVersion: true,
            }
        });

        if (!user) {
            console.log("User not found!");
            return;
        }

        console.log("User found:", { ...user, passwordHash: "[REDACTED]" });

        if (!user.passwordHash) {
            console.log("User has no password hash!");
            return;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        console.log(`Password is valid: ${isValid}`);

        // Try the update that happens in login
        console.log("Testing update lastLoginAt...");
        await prisma.user.update({
            where: { tenantId_id: { tenantId: user.tenantId, id: user.id } },
            data: { lastLoginAt: new Date() },
        });
        console.log("Update successful.");

    } catch (error: any) {
        console.error("REPRO ERROR:", error);
    }
}

repro().catch(console.error);
