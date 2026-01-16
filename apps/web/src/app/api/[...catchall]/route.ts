import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function notFound() {
    console.log('[Catchall] Returning 404');
    return NextResponse.json({ error: 'NOT_FOUND', message: 'API endpoint not found' }, { status: 404 });
}

export async function GET(req: NextRequest) {
    console.log('[Catchall] GET request');
    return notFound();
}

export async function POST(req: NextRequest) {
    console.log('[Catchall] POST request');
    return notFound();
}

export async function PUT(req: NextRequest) {
    return notFound();
}

export async function DELETE(req: NextRequest) {
    return notFound();
}

export async function PATCH(req: NextRequest) {
    return notFound();
}
