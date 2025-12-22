import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024,      // 5MB
    video: 100 * 1024 * 1024,    // 100MB
    document: 25 * 1024 * 1024,  // 25MB
    archive: 50 * 1024 * 1024,   // 50MB
};

const ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    document: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    archive: ['application/zip', 'application/x-zip-compressed'],
    test: ['application/json', 'application/xml', 'text/xml'],
};

function getFileCategory(mimeType: string): string | null {
    for (const [category, types] of Object.entries(ALLOWED_MIME_TYPES)) {
        if (types.includes(mimeType)) {
            return category;
        }
    }
    return null;
}

function validateFile(file: File): { valid: boolean; error?: string; category?: string } {
    const category = getFileCategory(file.type);

    if (!category) {
        return { valid: false, error: `File type ${file.type} is not allowed` };
    }

    const maxSize = MAX_FILE_SIZES[category as keyof typeof MAX_FILE_SIZES];
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit for ${category} files` };
    }

    return { valid: true, category };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Convert to base64 for now (simple storage solution)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        // For production, you would upload to S3/Cloudinary here
        // For now, return the base64 data URL
        return NextResponse.json({
            success: true,
            file: {
                url: dataUrl,
                name: file.name,
                size: file.size,
                mimeType: file.type,
                category: validation.category,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
