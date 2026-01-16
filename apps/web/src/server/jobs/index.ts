/**
 * Job Queue Module - Central Export
 * 
 * Usage:
 * ```typescript
 * import { jobs } from '@/lib/jobs';
 * 
 * // Send welcome email
 * await jobs.email.sendWelcome({
 *   to: user.email,
 *   subject: 'Welcome to Zedny LMS',
 *   tenantId: session.tenantId,
 *   userId: user.id,
 * });
 * 
 * // Award points
 * await jobs.gamification.awardPoints({
 *   userId: user.id,
 *   tenantId: session.tenantId,
 *   eventType: 'COURSE_COMPLETED',
 *   points: 100,
 * });
 * 
 * // Add timeline event
 * await jobs.timeline.addEvent({
 *   userId: user.id,
 *   tenantId: session.tenantId,
 *   eventType: 'ENROLLMENT_CREATED',
 *   courseId: course.id,
 * });
 * ```
 */

export * from './queues';
export * from './workers';
