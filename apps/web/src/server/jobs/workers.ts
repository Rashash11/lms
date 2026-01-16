import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import {
    QUEUE_NAMES,
    EmailJobData,
    NotificationJobData,
    CertificateJobData,
    ReportJobData,
    GamificationJobData,
    TimelineJobData,
    ImportJobData,
} from './queues';
import { readFile } from 'fs/promises';
import { hashPassword } from '@/lib/auth';
import type { UserStatus, RoleKey } from '@prisma/client';

/**
 * Worker Configuration
 * 
 * This module defines the job processors for all queues.
 * Run this in a separate process or as part of your server startup.
 */

// Redis connection configuration
const getRedisConnection = () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
});

/**
 * Email worker processor
 */
async function processEmailJob(job: Job<EmailJobData>) {
    const { type, to, subject, templateId, templateData, tenantId } = job.data;

    console.log(`[EMAIL] Processing ${type} email to ${to}`);

    // TODO: Integrate with actual email service (SendGrid, etc.)
    // For now, just log the email

    switch (type) {
        case 'welcome':
            console.log(`[EMAIL] Welcome email to ${to}`);
            // await sendgrid.send({ to, subject, template: 'welcome', data: templateData });
            break;

        case 'password_reset':
            console.log(`[EMAIL] Password reset email to ${to}`);
            break;

        case 'notification':
            console.log(`[EMAIL] Notification email to ${to}: ${subject}`);
            break;

        case 'certificate_ready':
            console.log(`[EMAIL] Certificate ready email to ${to}`);
            break;

        case 'enrollment':
            console.log(`[EMAIL] Enrollment email to ${to}`);
            break;
    }

    return { success: true, sentAt: new Date().toISOString() };
}

/**
 * Notification worker processor
 */
async function processNotificationJob(job: Job<NotificationJobData>) {
    const { type, recipientId, tenantId, title, body, link, metadata } = job.data;

    console.log(`[NOTIFICATION] Processing ${type} notification to ${recipientId}`);

    // Create in-app notification record
    if (type === 'in_app' || type === 'email') {
        try {
            await prisma.notification.create({
                data: {
                    tenantId,
                    userId: recipientId,
                    title,
                    message: body,
                    link,
                    metadata: metadata || {},
                    isRead: false,
                    eventKey: 'CUSTOM',
                },
            });
        } catch (error) {
            console.error('[NOTIFICATION] Failed to create notification:', error);
            throw error;
        }
    }

    return { success: true, deliveredAt: new Date().toISOString() };
}

/**
 * Certificate worker processor
 */
async function processCertificateJob(job: Job<CertificateJobData>) {
    const { type, certificateIssueId, userId, courseId, templateId, tenantId } = job.data;

    console.log(`[CERTIFICATE] Processing ${type} for user ${userId}`);

    switch (type) {
        case 'check_eligibility':
            // Check if user is eligible for certificate
            if (!courseId) throw new Error('courseId required for eligibility check');

            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    tenantId,
                    userId,
                    courseId,
                    status: 'COMPLETED',
                },
                include: {
                    course: {
                        select: { certificateTemplateId: true },
                    },
                },
            });

            if (enrollment && enrollment.course.certificateTemplateId) {
                // User is eligible, trigger certificate issue
                console.log(`[CERTIFICATE] User ${userId} eligible for certificate`);
                // Import jobs and call jobs.certificate.generatePdf(...)
            }
            break;

        case 'generate_pdf':
            if (!certificateIssueId) throw new Error('certificateIssueId required');

            // TODO: Integrate with PDF generation (Puppeteer, etc.)
            console.log(`[CERTIFICATE] Generating PDF for ${certificateIssueId}`);

            // Update certificate record with PDF URL
            // await prisma.certificateIssue.update({
            //     where: { id: certificateIssueId },
            //     data: { pdfUrl: generatedPdfUrl },
            // });
            break;

        case 'issue':
            console.log(`[CERTIFICATE] Issuing certificate for user ${userId}`);
            break;
    }

    return { success: true, processedAt: new Date().toISOString() };
}

/**
 * Report worker processor
 */
async function processReportJob(job: Job<ReportJobData>) {
    const { type, reportId, format, filters, tenantId, userId, recipients } = job.data;

    console.log(`[REPORT] Processing ${type} for report ${reportId}`);

    switch (type) {
        case 'generate':
            // Generate report data
            console.log(`[REPORT] Generating report ${reportId}`);
            break;

        case 'export':
            // Export to file format
            console.log(`[REPORT] Exporting report ${reportId} as ${format}`);

            // Update ReportExport record
            // const exportRecord = await prisma.reportExport.update({...});
            break;

        case 'scheduled':
            // Run scheduled report and email to recipients
            console.log(`[REPORT] Running scheduled report ${reportId}`);

            if (recipients && recipients.length > 0) {
                // Queue email jobs for each recipient
                console.log(`[REPORT] Emailing to ${recipients.length} recipients`);
            }
            break;
    }

    return { success: true, processedAt: new Date().toISOString() };
}

/**
 * Gamification worker processor
 */
async function processGamificationJob(job: Job<GamificationJobData>) {
    const { type, userId, tenantId, eventType, points, metadata } = job.data;

    console.log(`[GAMIFICATION] Processing ${type} for user ${userId}`);

    switch (type) {
        case 'award_points':
            if (!points || !eventType) throw new Error('points and eventType required');

            // Add points to ledger
            await prisma.pointsLedger.create({
                data: {
                    tenantId,
                    userId,
                    action: eventType,
                    points,
                    metadata: metadata || {},
                },
            });

            console.log(`[GAMIFICATION] Awarded ${points} points to ${userId} for ${eventType}`);
            break;

        case 'check_badges':
            // Check if user qualifies for any badges
            const userPoints = await prisma.pointsLedger.aggregate({
                where: { userId, tenantId },
                _sum: { points: true },
            });

            const totalPoints = userPoints._sum.points || 0;
            console.log(`[GAMIFICATION] User ${userId} has ${totalPoints} total points`);

            // Check badge thresholds and award
            break;

        case 'level_up':
            // Check and update user level
            console.log(`[GAMIFICATION] Checking level for ${userId}`);
            break;

        case 'recalculate':
            // Recalculate all gamification for user
            console.log(`[GAMIFICATION] Recalculating for ${userId}`);
            break;
    }

    return { success: true, processedAt: new Date().toISOString() };
}

/**
 * Timeline worker processor
 */
async function processTimelineJob(job: Job<TimelineJobData>) {
    const { userId, tenantId, eventType, courseId, enrollmentId, details } = job.data;

    if (!tenantId) {
        console.warn(`[TIMELINE] Skipping event ${eventType} for user ${userId} because tenantId is missing.`);
        return { success: false, reason: 'Missing tenantId' };
    }

    console.log(`[TIMELINE] Adding ${eventType} event for user ${userId}`);

    try {
        await prisma.timelineEvent.create({
            data: {
                tenantId,
                userId,
                courseId,
                enrollmentId,
                eventType,
                details: details || {},
            },
        });
    } catch (error) {
        console.error('[TIMELINE] Failed to create event:', error);
        throw error;
    }

    return { success: true, createdAt: new Date().toISOString() };
}

/**
 * Import worker processor
 */
async function processImportJob(job: Job<ImportJobData>) {
    const { type, importJobId, filePath, tenantId, userId, options } = job.data;

    console.log(`[IMPORT] Processing ${type} import job ${importJobId}`);

    // Update job status to processing
    await prisma.importJob.update({
        where: { id: importJobId },
        data: { status: 'PROCESSING', startedAt: new Date() }
    });

    try {
        if (type === 'users') {
            const content = await readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const header = lines[0].split(',').map(h => h.trim().toLowerCase());

            let successCount = 0;
            let failureCount = 0;
            const errors: any[] = [];

            // Skip header
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const values = lines[i].split(',').map(v => v.trim());
                const row: any = {};
                header.forEach((h, index) => {
                    row[h] = values[index];
                });

                try {
                    // Basic validation
                    if (!row.email || !row.username) {
                        throw new Error(`Row ${i}: Missing email or username`);
                    }

                    // Check existing
                    const existing = await prisma.user.findFirst({
                        where: {
                            tenantId,
                            OR: [{ email: row.email }, { username: row.username }]
                        }
                    });

                    if (existing) {
                        if (options?.skipExisting) {
                            continue;
                        }
                        if (!options?.updateExisting) {
                            throw new Error(`Row ${i}: User with email/username already exists`);
                        }
                    }

                    const password = row.password || `Temp${Math.random().toString(36).slice(2)}!1`;
                    const passwordHash = await hashPassword(password);

                    const userData = {
                        tenantId,
                        email: row.email,
                        username: row.username,
                        firstName: row.firstname || row.first_name || '',
                        lastName: row.lastname || row.last_name || '',
                        passwordHash,
                        role: (row.role as RoleKey) || (options?.defaultRoleId as RoleKey) || 'LEARNER',
                        nodeId: row.nodeid || options?.defaultNodeId || null,
                        status: 'ACTIVE' as UserStatus,
                    };

                    if (existing && options?.updateExisting) {
                        await prisma.user.update({
                            where: { id: existing.id },
                            data: userData
                        });
                    } else {
                        await prisma.user.create({
                            data: userData
                        });
                    }

                    successCount++;
                } catch (e: any) {
                    failureCount++;
                    errors.push({ row: i, error: e.message });
                }
            }

            // Update job status to completed
            await prisma.importJob.update({
                where: { id: importJobId },
                data: {
                    status: failureCount === 0 ? 'COMPLETED' : 'PARTIAL',
                    completedAt: new Date(),
                    processedRows: lines.length - 1,
                    successRows: successCount,
                    errorRows: failureCount,
                    errorLog: errors
                }
            });
        }
    } catch (error: any) {
        console.error(`[IMPORT] Job ${importJobId} failed:`, error);
        await prisma.importJob.update({
            where: { id: importJobId },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                errorLog: [{ error: error.message }]
            }
        });
        throw error;
    }

    return { success: true };
}

/**
 * Create and start all workers
 */
export function createWorkers() {
    const connection = getRedisConnection();

    const workers: Worker[] = [];

    // Email worker
    workers.push(new Worker(
        QUEUE_NAMES.EMAIL,
        processEmailJob,
        { connection, concurrency: 10 }
    ));

    // Notification worker
    workers.push(new Worker(
        QUEUE_NAMES.NOTIFICATION,
        processNotificationJob,
        { connection, concurrency: 10 }
    ));

    // Certificate worker
    workers.push(new Worker(
        QUEUE_NAMES.CERTIFICATE,
        processCertificateJob,
        { connection, concurrency: 3 }
    ));

    // Report worker
    workers.push(new Worker(
        QUEUE_NAMES.REPORT,
        processReportJob,
        { connection, concurrency: 2 }
    ));

    // Gamification worker
    workers.push(new Worker(
        QUEUE_NAMES.GAMIFICATION,
        processGamificationJob,
        { connection, concurrency: 5 }
    ));

    // Timeline worker
    workers.push(new Worker(
        QUEUE_NAMES.TIMELINE,
        processTimelineJob,
        { connection, concurrency: 10 }
    ));

    // Import worker
    workers.push(new Worker(
        QUEUE_NAMES.IMPORT,
        processImportJob,
        { connection, concurrency: 1 }
    ));

    // Set up error handlers
    workers.forEach(worker => {
        worker.on('completed', job => {
            console.log(`[${worker.name}] Job ${job.id} completed`);
        });

        worker.on('failed', (job, err) => {
            console.error(`[${worker.name}] Job ${job?.id} failed:`, err.message);
        });

        worker.on('error', err => {
            console.error(`[${worker.name}] Worker error:`, err);
        });
    });

    console.log(`[WORKERS] Started ${workers.length} workers`);

    return workers;
}

/**
 * Graceful shutdown for workers
 */
export async function closeAllWorkers(workers: Worker[]) {
    await Promise.all(workers.map(w => w.close()));
    console.log('[WORKERS] All workers closed');
}
