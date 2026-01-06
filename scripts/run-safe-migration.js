const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runSafeMigration() {
    console.log('🔄 Running safe additive migration...\n');

    try {
        // Step 1: Add columns to users table
        console.log('Step 1: Adding new columns to users table...');
        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
        console.log('✅ Added is_active column');

        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false`;
        console.log('✅ Added is_verified column');

        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`;
        console.log('✅ Added last_login_at column\n');

        // Step 2: Create auth_role table
        console.log('Step 2: Creating RBAC tables...');
        try {
            await prisma.$executeRaw`
                CREATE TABLE auth_role (
                    id TEXT PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `;
            console.log('✅ Created auth_role table');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('⏭️  auth_role table already exists');
            } else throw e;
        }

        // Step 3: Create auth_permission table
        try {
            await prisma.$executeRaw`
                CREATE TABLE auth_permission (
                    id TEXT PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    "fullPermission" TEXT UNIQUE NOT NULL,
                    description TEXT,
                    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `;
            console.log('✅ Created auth_permission table');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('⏭️  auth_permission table already exists');
            } else throw e;
        }

        // Step 4: Create auth_role_permission table
        try {
            await prisma.$executeRaw`
                CREATE TABLE auth_role_permission (
                    "roleId" TEXT NOT NULL,
                    "permissionId" TEXT NOT NULL,
                    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY ("roleId", "permissionId"),
                    FOREIGN KEY ("roleId") REFERENCES auth_role(id) ON DELETE CASCADE,
                    FOREIGN KEY ("permissionId") REFERENCES auth_permission(id) ON DELETE CASCADE
                )
            `;
            console.log('✅ Created auth_role_permission table');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('⏭️  auth_role_permission table already exists');
            } else throw e;
        }

        // Step 5: Create indexes
        try {
            await prisma.$executeRaw`CREATE INDEX idx_auth_role_permission_role ON auth_role_permission("roleId")`;
            console.log('✅ Created roleId index');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('⏭️  roleId index already exists');
            } else throw e;
        }

        try {
            await prisma.$executeRaw`CREATE INDEX idx_auth_role_permission_perm ON auth_role_permission("permissionId")`;
            console.log('✅ Created permissionId index');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('⏭️  permissionId index already exists');
            } else throw e;
        }

        console.log('\n✅ Safe migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   ✅ Added 3 new columns to users table');
        console.log('   ✅ Created 3 RBAC tables');
        console.log('   ✅ Created 2 indexes for performance');
        console.log('\n✅ ZERO data loss - all existing data preserved');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    }
}

runSafeMigration()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
