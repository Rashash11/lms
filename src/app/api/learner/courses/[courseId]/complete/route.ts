import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/learner/courses/[courseId]/complete
 * Marks a course as completed and issues certificate if template exists.
 * Idempotent: Can be called multiple times safely.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await requireAuth();
        const { courseId } = await context.params;

        // Validate courseId
        if (!courseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        // Verify enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.userId,
                    courseId: courseId
                }
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        certificateTemplateId: true
                    }
                }
            }
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
        }

        const now = new Date();

        // Mark course as completed in enrollment
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                status: 'COMPLETED',
                progress: 100,
                completedAt: now,
                lastAccessedAt: now
            }
        });

        // Issue certificate if course has a template
        let certificateId: string | null = null;
        const hasCertificateTemplate = enrollment.course.certificateTemplateId;

        if (hasCertificateTemplate) {
            // Check if certificate already exists (manual idempotency)
            const existingCertificate = await prisma.certificateIssue.findFirst({
                where: {
                    userId: session.userId,
                    courseId: courseId
                }
            });

            if (existingCertificate) {
                // Update existing certificate
                const updated = await prisma.certificateIssue.update({
                    where: { id: existingCertificate.id },
                    data: {
                        lastIssuedDate: now
                    }
                });
                certificateId = updated.id;
            } else {
                // Create new certificate
                const created = await prisma.certificateIssue.create({
                    data: {
                        userId: session.userId,
                        courseId: courseId,
                        templateId: enrollment.course.certificateTemplateId!,
                        issuedAt: now,
                        lastIssuedDate: now
                    }
                });
                certificateId = created.id;
            }
        }

        return NextResponse.json({
            success: true,
            courseId,
            courseTitle: enrollment.course.title,
            completedAt: now,
            certificateIssued: !!certificateId,
            certificateId
        }, { status: 200 });

    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error completing course:', error);

        // Development: detailed error
        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json({
                error: 'Failed to complete course',
                message: error?.message,
                code: error?.code
            }, { status: 500 });
        }

        return NextResponse.json({ error: 'Failed to complete course' }, { status: 500 });
    }
}
