export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * GET /api/env
 * Public environment configuration endpoint
 */
export async function GET() {
    return NextResponse.json({
        env: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        features: {
            gamification: true,
            ecommerce: false,
            ai: true,
        }
    });
}
