import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import {
    withGuard,
    apiResponse,
    apiError,
    GuardedContext
} from '@/lib/api-guard';
import { validateFile, getFileCategory, ALLOWED_MIME_TYPES } from '@/lib/file-upload';

/**
 * POST /api/upload
 * Upload files with security validation
 */
export async function POST(request: NextRequest) {
    return withGuard(request, {
        permission: 'files:upload',
        auditEvent: 'FILE_UPLOAD',
    }, async (ctx: GuardedContext) => {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const courseId = formData.get('courseId') as string | null;
        const unitId = formData.get('unitId') as string | null;
        const kind = formData.get('kind') as string | null;
        const context = formData.get('context') as string | null;

        if (!file) {
            return apiError('No file provided', 400);
        }

        // Validate file using security module
        const category = getFileCategory(file.type);
        if (category === 'unknown') {
            return apiError('File type not supported', 400);
        }

        // Validate file using security module
        const validation = await validateFile(file, category as keyof typeof ALLOWED_MIME_TYPES);
        if (!validation.valid) {
            return apiError(validation.error || 'Invalid file', 400);
        }

        // Course unit asset upload
        if (courseId && unitId && kind) {
            const validKinds = ['video', 'audio', 'document', 'thumbnail'];
            if (!validKinds.includes(kind)) {
                return apiError(`Invalid kind. Must be one of: ${validKinds.join(', ')}`, 400);
            }

            const uploadDir = join(process.cwd(), 'public', 'uploads', courseId, unitId);
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            const timestamp = Date.now();
            const originalName = file.name;
            const extension = originalName.substring(originalName.lastIndexOf('.'));
            const fileName = `${kind}_${timestamp}${extension}`;
            const filePath = join(uploadDir, fileName);

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            const publicUrl = `/files/${courseId}/${unitId}/${fileName}`;

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

            return apiResponse({
                success: true,
                file: {
                    id: asset.id,
                    url: asset.url,
                    name: asset.name,
                    size: Number(asset.sizeBytes),
                    mimeType: asset.mimeType,
                    kind: asset.kind,
                    category: category,
                },
            }, 201);
        }

        // Assignment file upload
        if (kind && context === 'assignment') {
            const validKinds = ['video', 'audio', 'document', 'thumbnail'];
            if (!validKinds.includes(kind)) {
                return apiError(`Invalid kind. Must be one of: ${validKinds.join(', ')}`, 400);
            }

            const uploadDir = join(process.cwd(), 'public', 'uploads', 'assignments');
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            const timestamp = Date.now();
            const originalName = file.name;
            const extension = originalName.substring(originalName.lastIndexOf('.'));
            const fileName = `assignment_${timestamp}${extension}`;
            const filePath = join(uploadDir, fileName);

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            const publicUrl = `/uploads/assignments/${fileName}`;

            return apiResponse({
                success: true,
                file: {
                    url: publicUrl,
                    name: originalName,
                    size: file.size,
                    mimeType: file.type,
                    kind: kind,
                    category: category,
                },
            }, 201);
        }

        // Fallback: Return base64 for backward compatibility
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return apiResponse({
            success: true,
            file: {
                url: dataUrl,
                name: file.name,
                size: file.size,
                mimeType: file.type,
                category: category,
            },
        }, 201);
    });
}
