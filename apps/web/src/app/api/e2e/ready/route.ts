import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const readyFile = path.join(process.cwd(), '.e2e-ready');
    if (fs.existsSync(readyFile)) {
        return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 503 });
}

