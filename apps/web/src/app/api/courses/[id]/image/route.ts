import { withGuard } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withGuard(request, { permission: 'course:update' }, async () => {

    try {
        const courseId = params.id;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const filename = `${courseId}-${Date.now()}.${fileExtension}`;
        const filepath = path.join(uploadDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.writeFile(filepath, buffer);

        // Update course with image URL
        const imageUrl = `/uploads/courses/${filename}`;
        await prisma.course.update({
            where: { id: courseId },
            data: { thumbnailUrl: imageUrl }
        });

        return NextResponse.json({
            success: true,
            imageUrl
        });
    } catch (error) {
        console.error('Error uploading course image:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }

    });
}
