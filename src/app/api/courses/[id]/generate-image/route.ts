import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
        }

        // For now, we'll generate a placeholder image using a gradient
        // In production, you would call an AI image generation API here

        // Create a placeholder SVG image
        const svgContent = `
            \u003csvg width="280" height="160" xmlns="http://www.w3.org/2000/svg"\u003e
                \u003cdefs\u003e
                    \u003clinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"\u003e
                        \u003cstop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" /\u003e
                        \u003cstop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" /\u003e
                    \u003c/linearGradient\u003e
                \u003c/defs\u003e
                \u003crect width="280" height="160" fill="url(#grad1)" /\u003e
                \u003ctext x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle"\u003e
                    Course Image
                \u003c/text\u003e
            \u003c/svg\u003e
        `;

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        // Save SVG file
        const filename = `${courseId}-${Date.now()}.svg`;
        const filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, svgContent);

        // Update course with image URL
        const imageUrl = `/uploads/courses/${filename}`;
        await prisma.course.update({
            where: { id: courseId },
            data: { thumbnail_url: imageUrl }
        });

        return NextResponse.json({
            success: true,
            imageUrl
        });
    } catch (error) {
        console.error('Error generating course image:', error);
        return NextResponse.json(
            { error: 'Failed to generate image' },
            { status: 500 }
        );
    }
}
