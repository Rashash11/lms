import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// Helper to scrape URLs from course units (for files not explicitly in CourseFile table but used in config)
function scrapeFileUrls(units: any[]): string[] {
    const urls: Set<string> = new Set();
    // Implementation simplified for restore - assuming we mostly care about CourseFile records for now
    return Array.from(urls);
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;

        // 1. Get explicit CourseFiles
        const dbFiles = await prisma.courseFile.findMany({
            where: { courseId },
            orderBy: { createdAt: 'desc' }
        });

        const mappedFiles = dbFiles.map(f => ({
            id: f.id,
            name: f.name,
            url: f.url,
            size: Number(f.sizeBytes),
            type: f.mimeType,
            date: f.createdAt.toISOString()
        }));

        // Return array directly as expected by frontend
        return NextResponse.json(mappedFiles);

    } catch (error) {
        console.error('Error fetching files:', error);
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', courseId);

        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        const url = `/uploads/${courseId}/${filename}`;

        // Save to DB
        const courseFile = await prisma.courseFile.create({
            data: {
                courseId,
                name: file.name,
                url,
                sizeBytes: BigInt(file.size), // Prisma supports BigInt
                mimeType: file.type || 'application/octet-stream'
            }
        });

        // Convert BigInt to Number for JSON response
        return NextResponse.json({
            id: courseFile.id,
            name: courseFile.name,
            url: courseFile.url,
            size: Number(courseFile.sizeBytes),
            type: courseFile.mimeType,
            date: courseFile.createdAt.toISOString()
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
