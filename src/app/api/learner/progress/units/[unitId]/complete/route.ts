
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

/**
 * POST /api/learner/progress/units/[unitId]/complete
 * Marks a course unit as completed by the learner.
 * Schema-safe: Works even if user_unit_progress table doesn't exist.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ unitId: string }> }
) {
    try {
        const session = await requireAuth();
        const { unitId } = await context.params;

        // 1. Fetch unit and course information
        const unit = await prisma.courseUnit.findUnique({
            where: { id: unitId },
            select: { id: true, courseId: true }
        });

        if (!unit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        }

        // 2. Validate enrollment (Ownership & Permission check)
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.userId,
                    courseId: unit.courseId
                }
            }
        });

        if (!enrollment) {
            return NextResponse.json({
                error: 'FORBIDDEN',
                reason: 'You are not enrolled in the course for this unit.'
            }, { status: 403 });
        }

        // 3. Try to persist to user_unit_progress (may not exist)
        let progressPersisted = false;
        let completedCount = 0;
        let totalUnits = 0;
        let percent = 0;

        try {
            const now = new Date();
            const existingProgress = await prisma.user_unit_progress.findUnique({
                where: {
                    userId_unitId: {
                        userId: session.userId,
                        unitId: unit.id
                    }
                }
            });

            if (existingProgress) {
                await prisma.user_unit_progress.update({
                    where: { id: existingProgress.id },
                    data: {
                        status: 'COMPLETED',
                        progress: 100,
                        completedAt: now,
                        updatedAt: now,
                        attempts: { increment: 1 }
                    }
                });
            } else {
                await prisma.user_unit_progress.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: session.userId,
                        unitId: unit.id,
                        courseId: unit.courseId,
                        status: 'COMPLETED',
                        progress: 100,
                        startedAt: now,
                        completedAt: now,
                        updatedAt: now,
                        attempts: 1
                    }
                });
            }

            // Calculate progress
            totalUnits = await prisma.courseUnit.count({
                where: { courseId: unit.courseId, status: 'PUBLISHED' }
            });
            completedCount = await prisma.user_unit_progress.count({
                where: {
                    userId: session.userId,
                    courseId: unit.courseId,
                    status: 'COMPLETED'
                }
            });

            percent = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

            // Update enrollment progress
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    progress: percent,
                    status: percent === 100 ? 'COMPLETED' : 'IN_PROGRESS',
                    lastAccessedAt: now,
                    completedAt: percent === 100 ? now : undefined
                }
            });

            progressPersisted = true;
        } catch (error: any) {
            // Table doesn't exist or other error - continue gracefully
            console.log('[Unit Complete] Progress persistence unavailable:', error.code || error.message?.substring(0, 50));
        }

        // 4. ALWAYS update learner_course_state for resume functionality
        try {
            await prisma.learner_course_state.upsert({
                where: {
                    userId_courseId: {
                        userId: session.userId,
                        courseId: unit.courseId
                    }
                },
                update: {
                    lastUnitId: unitId,
                    lastAccessedAt: new Date(),
                    updatedAt: new Date()
                },
                create: {
                    userId: session.userId,
                    courseId: unit.courseId,
                    lastUnitId: unitId,
                    lastAccessedAt: new Date()
                }
            });
        } catch (error) {
            console.error('[Unit Complete] Failed to update resume state:', error);
        }

        // Return success regardless of progress persistence
        return NextResponse.json({
            success: true,
            ok: true,
            completedUnits: completedCount,
            totalUnits,
            percent,
            progressPersisted
        }, { status: 200 });
    } catch (error: any) {
        // Auth errors - return 401
        if (error?.statusCode === 401 || error?.message?.includes('Not authenticated')) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        console.error('Error in unit completion:', error);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
}
