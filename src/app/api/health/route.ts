import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Check database connectivity by running a simple query
        await prisma.$queryRaw`SELECT 1`;

        // Additionally, try to query a user to ensure tables exist
        const userCount = await prisma.user.count();

        return NextResponse.json({
            ok: true,
            db: 'connected',
            timestamp: new Date().toISOString(),
            userCount,
        });
    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json(
            {
                ok: false,
                db: 'disconnected',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
