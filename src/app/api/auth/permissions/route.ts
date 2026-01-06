import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getUserPermissions } from "@/lib/permissions";

export async function GET(request: NextRequest) {
    try {
        const context = await requireAuth();
        const { searchParams } = new URL(request.url);
        const nodeId = searchParams.get("nodeId") ? parseInt(searchParams.get("nodeId")!) : undefined;

        const permissions = await getUserPermissions(context.userId, nodeId || context.nodeId);

        return NextResponse.json({ permissions });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: error.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: error.message },
                { status: error.statusCode }
            );
        }

        console.error("Permissions endpoint error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Failed to get permissions" },
            { status: 500 }
        );
    }
}
