const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTokenVersion() {
    console.log('🔧 Normalizing tokenVersion to default 0...\n');

    try {
        // Update existing NULL values to 0
        await prisma.$executeRawUnsafe(`
            UPDATE users SET token_version = 0 WHERE token_version IS NULL
        `);
        console.log('✅ Set NULL token_version values to 0');

        // Alter column to NOT NULL DEFAULT 0 (if not already)
        await prisma.$executeRawUnsafe(`
            ALTER TABLE users 
            ALTER COLUMN token_version SET DEFAULT 0,
            ALTER COLUMN token_version SET NOT NULL
        `);
        console.log('✅ Set token_version to NOT NULL DEFAULT 0');

        // Verify
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users WHERE token_version IS NULL`;
        const nullCount = result[0]?.count || 0;

        if (Number(nullCount) === 0) {
            console.log('✅ All users have valid token_version\n');
        } else {
            console.warn(`⚠️  ${nullCount} users still have NULL token_version\n`);
        }

    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            console.log('⏭️  Column already configured\n');
        } else {
            throw err;
        }
    }
}

fixTokenVersion()
    .catch(e => {
        console.error('❌ Failed:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
