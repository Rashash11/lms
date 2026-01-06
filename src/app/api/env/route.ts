export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Environment configuration endpoint
 * This is a placeholder - the frontend is calling this but it's not critical
 */
export async function GET() {
    return NextResponse.json({
        env: process.env.NODE_ENV || 'development',
        version: '1.0.0',
    });
}
