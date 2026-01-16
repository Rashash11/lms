import { Queue, Worker, Job, QueueEvents } from 'bullmq';

/**
 * BullMQ Job Queue Configuration
 * 
 * This module provides the background job infrastructure for:
 * - Email sending
 * - Certificate generation
 * - Report generation
 * - Notifications
 * - Gamification calculations
 * - Data imports
 */

// Redis connection configuration
const getRedisConnection = () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
});

/**
 * Queue names
 */
export const QUEUE_NAMES = {
    EMAIL: 'email',
    NOTIFICATION: 'notification',
    CERTIFICATE: 'certificate',
    REPORT: 'report',
    IMPORT: 'import',
    GAMIFICATION: 'gamification',
    TIMELINE: 'timeline',
    AUTOMATION: 'automation',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

/**
 * Default job options by queue type
 */
const DEFAULT_JOB_OPTIONS: Record<QueueName, { attempts: number; backoff: { type: 'exponential' | 'fixed'; delay: number }; removeOnComplete?: number; removeOnFail?: number }> = {
    [QUEUE_NAMES.EMAIL]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
    [QUEUE_NAMES.NOTIFICATION]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
    [QUEUE_NAMES.CERTIFICATE]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
    },
    [QUEUE_NAMES.REPORT]: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 30000 },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
    [QUEUE_NAMES.IMPORT]: {
        attempts: 1, // Imports should not auto-retry
        backoff: { type: 'fixed', delay: 0 },
        removeOnComplete: 50,
        removeOnFail: 100,
    },
    [QUEUE_NAMES.GAMIFICATION]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
    },
    [QUEUE_NAMES.TIMELINE]: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
    [QUEUE_NAMES.AUTOMATION]: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
    },
};

/**
 * Queue registry - creates queues lazily
 */
const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
    if (!queues.has(name)) {
        const queue = new Queue(name, {
            connection: getRedisConnection(),
            defaultJobOptions: DEFAULT_JOB_OPTIONS[name],
        });
        queues.set(name, queue);
    }
    return queues.get(name)!;
}

/**
 * Job payload types
 */
export interface EmailJobData {
    type: 'welcome' | 'password_reset' | 'notification' | 'certificate_ready' | 'enrollment';
    to: string;
    subject: string;
    templateId?: string;
    templateData?: Record<string, any>;
    tenantId: string;
    userId?: string;
}

export interface NotificationJobData {
    type: 'in_app' | 'push' | 'email';
    recipientId: string;
    tenantId: string;
    title: string;
    body: string;
    link?: string;
    metadata?: Record<string, any>;
}

export interface CertificateJobData {
    type: 'generate_pdf' | 'check_eligibility' | 'issue';
    certificateIssueId?: string;
    userId: string;
    courseId?: string;
    templateId?: string;
    tenantId: string;
}

export interface ReportJobData {
    type: 'generate' | 'export' | 'scheduled';
    reportId: string;
    format?: 'csv' | 'xlsx' | 'pdf';
    filters?: Record<string, any>;
    tenantId: string;
    userId: string;
    recipients?: string[];
}

export interface ImportJobData {
    type: 'users' | 'enrollments' | 'courses';
    importJobId: string;
    filePath: string;
    tenantId: string;
    userId: string;
    options?: Record<string, any>;
}

export interface GamificationJobData {
    type: 'award_points' | 'check_badges' | 'level_up' | 'recalculate';
    userId: string;
    tenantId: string;
    eventType?: string;
    points?: number;
    metadata?: Record<string, any>;
}

export interface TimelineJobData {
    type: 'add_event';
    tenantId: string;
    userId: string;
    eventType: string;
    courseId?: string;
    enrollmentId?: string;
    details?: Record<string, any>;
}

export interface AutomationJobData {
    type: 'evaluate' | 'execute';
    automationId: string;
    triggerId?: string;
    tenantId: string;
    userId?: string;
    action?: string;
}

/**
 * Add a job to a queue
 */
export async function addJob<T extends Record<string, any>>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: {
        delay?: number;
        priority?: number;
        jobId?: string;
    }
): Promise<Job<T>> {
    const queue = getQueue(queueName);

    return queue.add(jobName, data, {
        delay: options?.delay,
        priority: options?.priority,
        jobId: options?.jobId,
    });
}

/**
 * Convenience methods for adding jobs
 */
export const jobs = {
    email: {
        sendWelcome: (data: Omit<EmailJobData, 'type'>) =>
            addJob(QUEUE_NAMES.EMAIL, 'send_welcome', { ...data, type: 'welcome' as const }),
        sendPasswordReset: (data: Omit<EmailJobData, 'type'>) =>
            addJob(QUEUE_NAMES.EMAIL, 'send_password_reset', { ...data, type: 'password_reset' as const }),
        sendNotification: (data: Omit<EmailJobData, 'type'>) =>
            addJob(QUEUE_NAMES.EMAIL, 'send_notification', { ...data, type: 'notification' as const }),
        sendCertificateReady: (data: Omit<EmailJobData, 'type'>) =>
            addJob(QUEUE_NAMES.EMAIL, 'send_certificate_ready', { ...data, type: 'certificate_ready' as const }),
    },

    notification: {
        send: (data: NotificationJobData) =>
            addJob(QUEUE_NAMES.NOTIFICATION, 'send_notification', data),
        sendBatch: (notifications: NotificationJobData[]) =>
            Promise.all(notifications.map(n => addJob(QUEUE_NAMES.NOTIFICATION, 'send_notification', n))),
    },

    certificate: {
        checkEligibility: (data: Pick<CertificateJobData, 'userId' | 'courseId' | 'tenantId'>) =>
            addJob(QUEUE_NAMES.CERTIFICATE, 'check_eligibility', { ...data, type: 'check_eligibility' as const }),
        generatePdf: (data: Pick<CertificateJobData, 'certificateIssueId' | 'tenantId' | 'userId'>) =>
            addJob(QUEUE_NAMES.CERTIFICATE, 'generate_pdf', { ...data, type: 'generate_pdf' as const }),
    },

    report: {
        generate: (data: Omit<ReportJobData, 'type'>) =>
            addJob(QUEUE_NAMES.REPORT, 'generate', { ...data, type: 'generate' as const }),
        export: (data: Omit<ReportJobData, 'type'>) =>
            addJob(QUEUE_NAMES.REPORT, 'export', { ...data, type: 'export' as const }),
        runScheduled: (data: Omit<ReportJobData, 'type'>) =>
            addJob(QUEUE_NAMES.REPORT, 'scheduled', { ...data, type: 'scheduled' as const }),
    },

    import: {
        users: (data: Omit<ImportJobData, 'type'>) =>
            addJob(QUEUE_NAMES.IMPORT, 'import_users', { ...data, type: 'users' as const }),
        enrollments: (data: Omit<ImportJobData, 'type'>) =>
            addJob(QUEUE_NAMES.IMPORT, 'import_enrollments', { ...data, type: 'enrollments' as const }),
    },

    gamification: {
        awardPoints: (data: Omit<GamificationJobData, 'type'>) =>
            addJob(QUEUE_NAMES.GAMIFICATION, 'award_points', { ...data, type: 'award_points' as const }),
        checkBadges: (data: Pick<GamificationJobData, 'userId' | 'tenantId'>) =>
            addJob(QUEUE_NAMES.GAMIFICATION, 'check_badges', { ...data, type: 'check_badges' as const }),
        recalculate: (data: Pick<GamificationJobData, 'userId' | 'tenantId'>) =>
            addJob(QUEUE_NAMES.GAMIFICATION, 'recalculate', { ...data, type: 'recalculate' as const }),
    },

    timeline: {
        addEvent: (data: Omit<TimelineJobData, 'type'>) =>
            addJob(QUEUE_NAMES.TIMELINE, 'add_event', { ...data, type: 'add_event' as const }),
    },

    automation: {
        evaluate: (data: Omit<AutomationJobData, 'type'>) =>
            addJob(QUEUE_NAMES.AUTOMATION, 'evaluate', { ...data, type: 'evaluate' as const }),
        execute: (data: Omit<AutomationJobData, 'type'>) =>
            addJob(QUEUE_NAMES.AUTOMATION, 'execute', { ...data, type: 'execute' as const }),
    },
};

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: QueueName) {
    const queue = getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
}

/**
 * Get all queue statistics
 */
export async function getAllQueueStats() {
    const stats: Record<string, Awaited<ReturnType<typeof getQueueStats>>> = {};

    for (const name of Object.values(QUEUE_NAMES)) {
        stats[name] = await getQueueStats(name);
    }

    return stats;
}

/**
 * Graceful shutdown - close all queues
 */
export async function closeAllQueues() {
    const closePromises: Promise<void>[] = [];

    for (const queue of queues.values()) {
        closePromises.push(queue.close());
    }

    await Promise.all(closePromises);
    queues.clear();
}
