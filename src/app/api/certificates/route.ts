import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCertificateSchema = z.object({
    userId: z.string().uuid(),
    courseId: z.string().uuid().optional(),
    templateId: z.string().uuid().optional(),
    title: z.string().min(1),
    issueDate: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
    customFields: z.record(z.any()).optional(),
});

// GET user's certificates
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (userId) {
            where.userId = userId;
        }

        const [certificates, total] = await Promise.all([
            prisma.certificateIssue.findMany({
                where,
                skip,
                take: limit,
                orderBy: { issuedAt: 'desc' },
            }),
            prisma.certificateIssue.count({ where }),
        ]);

        // Get course details for certificates
        const courseIds = certificates.map((c) => c.courseId).filter((id): id is string => Boolean(id));
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, title: true, code: true }
        });
        const courseMap = new Map(courses.map(c => [c.id, c]));

        const certificatesWithCourses = certificates.map((cert) => ({
            ...cert,
            course: cert.courseId ? courseMap.get(cert.courseId) : null,
        }));

        return NextResponse.json({
            certificates: certificatesWithCourses,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
    }
}

// POST issue a certificate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createCertificateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if user completed the course (if courseId provided)
        if (data.courseId) {
            const enrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
            });

            if (!enrollment || enrollment.status !== 'COMPLETED') {
                return NextResponse.json(
                    { error: 'User has not completed this course' },
                    { status: 400 }
                );
            }
        }

        let templateId = data.templateId;
        if (templateId) {
            const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
            if (!template) {
                templateId = undefined;
            }
        }

        if (!templateId) {
            const existingTemplate = await prisma.certificateTemplate.findFirst({
                orderBy: { createdAt: 'asc' },
            });
            if (existingTemplate) {
                templateId = existingTemplate.id;
            } else {
                const createdTemplate = await prisma.certificateTemplate.create({
                    data: {
                        name: 'Default',
                        htmlBody: '',
                        smartTags: {},
                        isSystem: true,
                    },
                });
                templateId = createdTemplate.id;
            }
        }

        const certificate = await prisma.certificateIssue.create({
            data: {
                userId: data.userId,
                courseId: data.courseId,
                templateId,
                issuedAt: data.issueDate ? new Date(data.issueDate) : new Date(),
                expiresAt: data.expiryDate ? new Date(data.expiryDate) : null,
            },
        });

        // Update enrollment with certificate
        if (data.courseId) {
            await prisma.enrollment.update({
                where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
                data: { certificateId: certificate.id },
            });
        }

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId: data.userId,
                courseId: data.courseId,
                eventType: 'CERTIFICATE_ISSUED',
                details: { title: data.title },
            },
        });

        return NextResponse.json(certificate, { status: 201 });
    } catch (error) {
        console.error('Error creating certificate:', error);
        return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
    }
}
