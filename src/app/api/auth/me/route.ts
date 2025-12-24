import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            id: session.userId,
            email: session.email,
            username: session.username,
            firstName: session.firstName,
            lastName: session.lastName,
            roles: session.roles,
            activeRole: session.activeRole,
        });
    } catch (error) {
        console.error("Error getting user info:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
