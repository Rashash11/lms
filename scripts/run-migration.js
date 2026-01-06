const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
    const sqlPath = path.join(__dirname, '../prisma/migrations/20260105_add_auth_rbac_manual/migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running manual migration...');

    try {
        await prisma.$executeRawUnsafe(sql);
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();
