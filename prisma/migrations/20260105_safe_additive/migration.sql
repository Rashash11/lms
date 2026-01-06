-- Safe additive migration: Add ONLY new columns (NO renames, NO drops)
-- Migration is truly non-destructive and preserves all data

-- Step 1: Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Step 2: Create auth_role table (must be created first - referenced by auth_role_permission)
CREATE TABLE IF NOT EXISTS auth_role (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create auth_permission table (must be created second - referenced by auth_role_permission)
CREATE TABLE IF NOT EXISTS auth_permission (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    "fullPermission" TEXT UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create auth_role_permission junction table (depends on both above tables)
CREATE TABLE IF NOT EXISTS auth_role_permission (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId")
);

-- Step 5: Add foreign keys only if table was just created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auth_role_permission_roleId_fkey') THEN
        ALTER TABLE auth_role_permission 
        ADD CONSTRAINT auth_role_permission_roleId_fkey 
        FOREIGN KEY ("roleId") REFERENCES auth_role(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auth_role_permission_permissionId_fkey') THEN
        ALTER TABLE auth_role_permission 
        ADD CONSTRAINT auth_role_permission_permissionId_fkey 
        FOREIGN KEY ("permissionId") REFERENCES auth_permission(id) ON DELETE CASCADE;
    END IF;
END$$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_role_permission_role ON auth_role_permission("roleId");
CREATE INDEX IF NOT EXISTS idx_auth_role_permission_perm ON auth_role_permission("permissionId");

-- Migration complete: ZERO destructive changes, all existing data preserved
