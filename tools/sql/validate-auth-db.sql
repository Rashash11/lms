-- Authentication & RBAC Database Validation Queries
-- Run these against: postgresql://lms_user:password@localhost:5433/lms_db

-- ========================================
-- 1. USER AUTH COLUMNS STRUCTURE
-- ========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN (
    'id', 'email', 'passwordHash', 'password_hash',
    'activeRole', 'node_id', 'is_active', 'is_verified', 'token_version'
  )
ORDER BY ordinal_position;

-- ========================================
-- 2. SAMPLE USERS WITH AUTH FIELDS
-- ========================================
SELECT 
    id,
    email,
    username,
    "activeRole",
    node_id,
    is_active,
    is_verified,
    token_version,
    CASE WHEN "passwordHash" IS NOT NULL THEN 'SET' ELSE 'NULL' END as password_status,
    "lastLoginAt",
    "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 10;

-- ========================================
-- 3. RBAC ROLES & PERMISSION COUNTS
-- ========================================
SELECT 
    ar.id,
    ar.name as role_name,
    ar.description,
    COUNT(DISTINCT arp.permission_id) as permission_count,
    array_agg(DISTINCT ap.name ORDER BY ap.name) FILTER (WHERE ap.name IS NOT NULL) as sample_permissions
FROM auth_role ar
LEFT JOIN auth_role_permission arp ON ar.id = arp.role_id
LEFT JOIN auth_permission ap ON arp.permission_id = ap.id
GROUP BY ar.id, ar.name, ar.description
ORDER BY permission_count DESC;

-- ========================================
-- 4. ALL PERMISSIONS BY ROLE
-- ========================================
-- Detailed view of each role's permissions
SELECT 
    ar.name as role_name,
    ap.name as permission_name,
    ap."fullPermission" as full_permission
FROM auth_role ar
JOIN auth_role_permission arp ON ar.id = arp.role_id
JOIN auth_permission ap ON arp.permission_id = ap.id
ORDER BY ar.name, ap.name;

-- ========================================
-- 5. NODE (BRANCH) DISTRIBUTION
-- ========================================
SELECT 
    COALESCE(node_id::TEXT, 'NULL (Global)') as node_id,
    COUNT(*) as user_count,
    array_agg(DISTINCT "activeRole") as roles_in_node,
    array_agg(email ORDER BY email) FILTER (WHERE "activeRole" = 'ADMIN') as admin_users
FROM users
GROUP BY node_id
ORDER BY user_count DESC;

-- ========================================
-- 6. USERS WITH RBAC OVERRIDES
-- ========================================
SELECT 
    id,
    email,
    "activeRole",
    "rbacOverrides"
FROM users
WHERE "rbacOverrides" IS NOT NULL
  AND "rbacOverrides"::text != '{}'
  AND "rbacOverrides"::text != 'null';

-- ========================================
-- 7. USER ROLES MAPPING
-- ========================================
-- Check user_role table for multiple role assignments
SELECT 
    u.email,
    u."activeRole" as active_role,
    array_agg(ur."roleKey" ORDER BY ur."roleKey") as assigned_roles
FROM users u
LEFT JOIN user_role ur ON u.id = ur."userId"
GROUP BY u.id, u.email, u."activeRole"
HAVING COUNT(ur."roleKey") > 0
ORDER BY u.email;

-- ========================================
-- 8. TOKEN VERSION AUDIT
-- ========================================
-- Users with non-zero token versions (revoked sessions)
SELECT 
    id,
    email,
    "activeRole",
    token_version,
    "lastLoginAt"
FROM users
WHERE token_version > 0
ORDER BY token_version DESC, "lastLoginAt" DESC;

-- ========================================
-- 9. BRANCH/NODE DETAILS
-- ========================================
-- If branches table exists
SELECT 
    b.id,
    b.name,
    b.description,
    COUNT(DISTINCT u.id) as user_count
FROM branches b
LEFT JOIN users u ON u.node_id = b.id
GROUP BY b.id, b.name, b.description
ORDER BY user_count DESC;

-- ========================================
-- 10. INACTIVE/UNVERIFIED USERS
-- ========================================
SELECT 
    email,
    "activeRole",
    is_active,
    is_verified,
    "createdAt"
FROM users
WHERE is_active = FALSE OR is_verified = FALSE
ORDER BY "createdAt" DESC;

-- ========================================
-- VALIDATION CHECKS
-- ========================================

-- Check 1: Users without password
SELECT COUNT(*) as users_without_password
FROM users
WHERE "passwordHash" IS NULL;

-- Check 2: Users without active role
SELECT COUNT(*) as users_without_active_role
FROM users
WHERE "activeRole" IS NULL;

-- Check 3: Admin users count
SELECT COUNT(*) as admin_user_count
FROM users
WHERE "activeRole" = 'ADMIN';

-- Check 4: RBAC table existence
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_role') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as auth_role_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_permission') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as auth_permission_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_role_permission') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as auth_role_permission_table;

-- Check 5: Permission count by resource
SELECT 
    SPLIT_PART(ap."fullPermission", ':', 1) as resource,
    COUNT(*) as permission_count
FROM auth_permission ap
GROUP BY resource
ORDER BY permission_count DESC;
