import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

function getMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const map: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/x-m4a',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
    };
    return map[ext] || 'application/octet-stream';
}

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const pathSegments = params.path;
        if (!pathSegments || pathSegments.length === 0) {
            return new NextResponse('File not found', { status: 404 });
        }

        const filePath = join(process.cwd(), 'public', 'uploads', ...pathSegments);

        try {
            const stats = await stat(filePath);
            if (!stats.isFile()) {
                return new NextResponse('File not found', { status: 404 });
            }
        } catch (e) {
            console.error('File stat error:', e);
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = await readFile(filePath);

        // Determine mime type
        const mimeType = getMimeType(filePath);

        const headers = new Headers();
        headers.set('Content-Type', mimeType);
        headers.set('Content-Length', fileBuffer.length.toString());
        // Cache control
        headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');

        return new NextResponse(fileBuffer, { headers });

    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
