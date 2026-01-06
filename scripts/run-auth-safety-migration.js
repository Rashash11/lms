const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
    console.log('🔧 Running auth safety migration...\n');

    const statements = [
        {
            name: 'Add token_version column',
            sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1`
        },
        {
            name: 'Add index for token_version',
            sql: `CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(token_version)`
        },
        {
            name: 'Create auth_audit_log table',
            sql: `CREATE TABLE IF NOT EXISTS auth_audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_type VARCHAR(50) NOT NULL,
                user_id VARCHAR(255),
                ip_address VARCHAR(45),
                user_agent TEXT,
                metadata JSONB,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )`
        },
        {
            name: 'Add index for audit_log user_id',
            sql: `CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id)`
        },
        {
            name: 'Add index for audit_log event_type',
            sql: `CREATE INDEX IF NOT EXISTS idx_auth_audit_log_event_type ON auth_audit_log(event_type)`
        },
        {
            name: 'Add index for audit_log created_at',
            sql: `CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log(created_at DESC)`
        }
    ];

    for (const stmt of statements) {
        try {
            await prisma.$executeRawUnsafe(stmt.sql);
            console.log(`✅ ${stmt.name}`);
        } catch (err) {
            // Ignore "already exists" errors
            if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
                console.log(`⏭️  ${stmt.name} (already exists)`);
            } else {
                console.error(`❌ ${stmt.name} failed:`, err.message);
                throw err;
            }
        }
    }

    console.log('\n✅ Auth safety migration complete!');
}

runMigration()
    .catch(e => {
        console.error('\n❌ Migration failed:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
