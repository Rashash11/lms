import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET() {
    try {
        const session = await requireAuth();

        // Only users with user:assign_permission should see full permission list
        const hasPermission = await can(session, "user:assign_permission");
        if (!hasPermission) {
            return NextResponse.json({ error: "FORBIDDEN", message: "Missing permission: user:assign_permission" }, { status: 403 });
        }

        // Try Prisma first, fallback to raw SQL if model name mismatch
        let permissions: any[];
        try {
            permissions = await (prisma as any).authPermission.findMany({
                orderBy: { name: 'asc' }
            });
        } catch (e) {
            permissions = await prisma.$queryRaw`SELECT * FROM auth_permission ORDER BY name ASC`;
        }

        const response = NextResponse.json({ permissions });
        response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
        return response;
    } catch (error: any) {
        const status = error.status || error.statusCode || (error.name === 'AuthError' ? 401 : 500);
        if (status < 500) {
            return NextResponse.json({ error: error.name === 'AuthError' ? "UNAUTHORIZED" : "ERROR", message: error.message }, { status });
        }
        console.error("[ADMIN_PERMISSIONS_GET] Error:", error);
        return NextResponse.json({
            error: "INTERNAL_ERROR",
            message: process.env.NODE_ENV === 'development' ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
