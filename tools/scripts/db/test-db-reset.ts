/**
 * Test Database Reset Script
 * 
 * Resets the test database using Prisma.
 * Uses DATABASE_URL_TEST environment variable.
 * 
 * Usage: npx tsx scripts/test-db-reset.ts
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });
dotenv.config();

const TEST_DB_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

if (!TEST_DB_URL) {
    console.error('❌ DATABASE_URL_TEST or DATABASE_URL must be set');
    process.exit(1);
}

// Safety check: prevent accidental production reset
if (TEST_DB_URL.includes('production') || TEST_DB_URL.includes('prod')) {
    console.error('❌ DANGER: Attempted to reset a production database!');
    console.error('   DATABASE_URL_TEST contains "production" or "prod"');
    process.exit(1);
}

console.log('🔄 Resetting test database...');
console.log(`   Using: ${TEST_DB_URL.replace(/:[^:@]+@/, ':****@')}`);

try {
    // Set the DATABASE_URL for Prisma commands
    const env = { ...process.env, DATABASE_URL: TEST_DB_URL };

    // Run prisma db push to sync schema and reset data
    execSync('npx prisma db push --force-reset --accept-data-loss', {
        stdio: 'inherit',
        env,
        cwd: process.cwd(),
    });

    console.log('✅ Test database reset complete');
} catch (error) {
    console.error('❌ Failed to reset test database:', error);
    process.exit(1);
}
