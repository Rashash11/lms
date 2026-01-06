import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET() {
    try {
        const session = await requireAuth();

        // Only users with user:create or user:update (or generally admin) should see roles
        const hasPermission = await can(session, "user:create");
        if (!hasPermission) {
            return NextResponse.json({ error: "FORBIDDEN", message: "Missing permission: user:create" }, { status: 403 });
        }

        // Try Prisma first, fallback to raw SQL if model name mismatch
        let roles: any[];
        try {
            roles = await (prisma as any).authRole.findMany({
                orderBy: { name: 'asc' }
            });
        } catch (e) {
            roles = await prisma.$queryRaw`SELECT * FROM auth_role ORDER BY name ASC`;
        }

        return NextResponse.json({ roles });
    } catch (error: any) {
        const status = error.status || error.statusCode || (error.name === 'AuthError' ? 401 : 500);
        if (status < 500) {
            return NextResponse.json({ error: error.name === 'AuthError' ? "UNAUTHORIZED" : "ERROR", message: error.message }, { status });
        }
        console.error("[ADMIN_ROLES_GET] Error:", error);
        return NextResponse.json({
            error: "INTERNAL_ERROR",
            message: process.env.NODE_ENV === 'development' ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
