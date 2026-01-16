#!/usr/bin/env node
/**
 * Worker Startup Script
 * 
 * Starts all BullMQ job workers for background processing.
 * Run this in a separate process from the Next.js server.
 * 
 * Usage:
 *   npx ts-node scripts/start-workers.ts
 *   # or in production:
 *   node dist/scripts/start-workers.js
 */

import { createWorkers, closeAllWorkers } from '../src/lib/jobs/workers';
import { closeAllQueues } from '../src/lib/jobs/queues';

console.log('╔═══════════════════════════════════════╗');
console.log('║     Zedny LMS Background Workers      ║');
console.log('╚═══════════════════════════════════════╝');

// Check Redis connection
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';
console.log(`\n📡 Connecting to Redis at ${redisHost}:${redisPort}...`);

// Start workers
let workers: ReturnType<typeof createWorkers>;

try {
    workers = createWorkers();
    console.log('✅ All workers started successfully\n');
    console.log('Workers running for queues:');
    console.log('  • email       - Welcome, password reset, notifications');
    console.log('  • notification- In-app and push notifications');
    console.log('  • certificate - PDF generation and eligibility checks');
    console.log('  • report      - Report generation and exports');
    console.log('  • gamification- Points, badges, and level ups');
    console.log('  • timeline    - User activity timeline events');
    console.log('\n🔄 Processing jobs... (Press Ctrl+C to stop)\n');
} catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
}

// Graceful shutdown handlers
const shutdown = async (signal: string) => {
    console.log(`\n\n⏹️  Received ${signal}, shutting down gracefully...`);

    try {
        // Close workers first (stop processing new jobs)
        await closeAllWorkers(workers);
        console.log('✅ Workers closed');

        // Close queue connections
        await closeAllQueues();
        console.log('✅ Queue connections closed');

        console.log('\n👋 Goodbye!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep the process running
process.stdin.resume();
