import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024,      // 5MB
    video: 500 * 1024 * 1024,    // 500MB for video
    audio: 100 * 1024 * 1024,    // 100MB for audio
    document: 50 * 1024 * 1024,  // 50MB
    archive: 50 * 1024 * 1024,   // 50MB
};

const ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a'],
    document: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.ms-powerpoint',
        'text/plain',
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
        const courseId = formData.get('courseId') as string | null;
        const unitId = formData.get('unitId') as string | null;
        const kind = formData.get('kind') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // If courseId and unitId provided, save to disk and database
        if (courseId && unitId && kind) {
            // Validate kind
            const validKinds = ['video', 'audio', 'document', 'thumbnail'];
            if (!validKinds.includes(kind)) {
                return NextResponse.json(
                    { error: `Invalid kind. Must be one of: ${validKinds.join(', ')}` },
                    { status: 400 }
                );
            }

            // Create upload directory structure
            const uploadDir = join(process.cwd(), 'public', 'uploads', courseId, unitId);
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const originalName = file.name;
            const extension = originalName.substring(originalName.lastIndexOf('.'));
            const fileName = `${kind}_${timestamp}${extension}`;
            const filePath = join(uploadDir, fileName);

            // Write file to disk
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            // Create public URL
            const publicUrl = `/uploads/${courseId}/${unitId}/${fileName}`;

            // Save asset metadata to database
            const asset = await prisma.unitAsset.create({
                data: {
                    courseId,
                    unitId,
                    kind,
                    url: publicUrl,
                    storageKey: fileName,
                    name: originalName,
                    sizeBytes: BigInt(file.size),
                    mimeType: file.type || 'application/octet-stream',
                },
            });

            // Return asset metadata (convert BigInt to string for JSON)
            return NextResponse.json({
                success: true,
                file: {
                    id: asset.id,
                    url: asset.url,
                    name: asset.name,
                    size: Number(asset.sizeBytes),
                    mimeType: asset.mimeType,
                    kind: asset.kind,
                    category: validation.category,
                },
            }, { status: 201 });
        }

        // Fallback: Return base64 for backward compatibility
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

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
