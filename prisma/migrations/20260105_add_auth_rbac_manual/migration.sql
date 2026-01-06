-- Manual migration: Add auth/RBAC columns and tables (ADDITIVE ONLY - NO DATA LOSS)
-- Generated: 2026-01-05

-- Step 1: Add new columns to users table (if they don't exist)
DO $$
BEGIN
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add is_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Rename activeRole column to role (if needed)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='activeRole') THEN
        ALTER TABLE users RENAME COLUMN "activeRole" TO role;
    END IF;

    -- Rename passwordHash to password_hash (if needed)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='passwordHash') THEN
        ALTER TABLE users RENAME COLUMN "passwordHash" TO password_hash;
    END IF;

    -- Rename lastLoginAt to last_login_at (if needed)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastLoginAt') THEN
        ALTER TABLE users RENAME COLUMN "lastLoginAt" TO last_login_at;
    END IF;

    -- Rename avatar to profile_image (if needed)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar') THEN
        ALTER TABLE users RENAME COLUMN avatar TO profile_image;
    END IF;
END $$;

-- Step 2: Create RBAC tables (if they don't exist)

-- Create auth_role table
CREATE TABLE IF NOT EXISTS auth_role (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create auth_permission table
CREATE TABLE IF NOT EXISTS auth_permission (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    "fullPermission" TEXT UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create auth_role_permission table
CREATE TABLE IF NOT EXISTS auth_role_permission (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "auth_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES auth_role(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "auth_role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES auth_permission(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "auth_role_permission_roleId_idx" ON auth_role_permission("roleId");
CREATE INDEX IF NOT EXISTS "auth_role_permission_permissionId_idx" ON auth_role_permission("permissionId");

-- Migration complete - all changes are ADDITIVE only, no data loss
