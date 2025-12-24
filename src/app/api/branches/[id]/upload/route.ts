import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ALLOWED_IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // logo, favicon, courseImage

        if (!type || !['logo', 'favicon', 'courseImage'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid upload type. Must be: logo, favicon, or courseImage' },
                { status: 400 }
            );
        }

        // Check if branch exists
        const branch = await prisma.branch.findUnique({
            where: { id: params.id },
        });

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: gif, jpg, jpeg, png' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds 3MB limit' },
                { status: 400 }
            );
        }

        // Convert to base64 data URL (simple storage solution)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        // Update branch with new image URL based on type
        const fieldMap: Record<string, string> = {
            logo: 'brandingLogoUrl',
            favicon: 'brandingFaviconUrl',
            courseImage: 'defaultCourseImageUrl',
        };

        const updateData: any = {};
        updateData[fieldMap[type]] = dataUrl;

        const updatedBranch = await prisma.branch.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            url: dataUrl,
            type,
        }, { status: 200 });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
