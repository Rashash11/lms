import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

/**
 * GET /api/organization-nodes
 * Returns a list of all organization nodes (currently placeholder returning empty array)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (!session) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "Authentication required" }, { status: 401 });
        }

        // The 'organization_node' model is missing from the current Prisma schema.
        // Returning an empty array to prevent 500 errors on the frontend as requested.
        return NextResponse.json({ nodes: [] });
    } catch (error: any) {
        const status = error.status || error.statusCode || (error.name === 'AuthError' ? 401 : 500);
        if (status < 500) {
            return NextResponse.json({ error: error.name === 'AuthError' ? "UNAUTHORIZED" : "ERROR", message: error.message }, { status });
        }
        console.error("[ORGANIZATION_NODES_GET] Error:", error);
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: "INTERNAL_ERROR",
            message: isDev ? error.message : "Internal server error"
        }, { status: 500 });
    }
}
