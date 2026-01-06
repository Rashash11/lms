import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to verify database connection
 * ONLY available in development mode
 */
export async function GET() {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse(null, { status: 404 });
    }

    try {
        // Run a raw query to get DB info
        const result = await prisma.$queryRaw<Array<{
            current_database: string;
            inet_server_port: number;
            current_user: string;
            server_version: string;
        }>>`
            SELECT 
                current_database() as current_database,
                inet_server_port() as inet_server_port,
                current_user as current_user,
                version() as server_version
        `;

        const dbInfo = result[0];

        // Parse DATABASE_URL for host
        let host = 'unknown';
        let configuredPort = 'unknown';
        let configuredDb = 'unknown';
        try {
            const url = new URL(process.env.DATABASE_URL || '');
            host = url.hostname;
            configuredPort = url.port;
            configuredDb = url.pathname.slice(1);
        } catch { }

        return NextResponse.json({
            status: "connected",
            config: {
                host,
                port: configuredPort,
                database: configuredDb,
            },
            actual: {
                database: dbInfo.current_database,
                port: dbInfo.inet_server_port,
                user: dbInfo.current_user,
                version: dbInfo.server_version?.split(' ').slice(0, 2).join(' '),
            },
            match: configuredDb === dbInfo.current_database,
        });

    } catch (error) {
        console.error("DB debug error:", error);
        return NextResponse.json({
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
}
