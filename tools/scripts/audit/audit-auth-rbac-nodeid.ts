/**
 * Auth, RBAC & Node Scoping Audit Script
 * 
 * Introspects database schema and scans codebase to verify
 * auth implementation compliance.
 * 
 * Run: npx ts-node scripts/audit-auth-rbac-nodeid.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface AuditResult {
    jwt: { pass: boolean; issues: string[] };
    rbac: { pass: boolean; issues: string[] };
    nodeScope: { pass: boolean; issues: string[] };
    evidence: { files: string[] };
}

async function checkDatabaseSchema(): Promise<{ tables: string[]; issues: string[] }> {
    const issues: string[] = [];
    const tables: string[] = [];

    const requiredTables = [
        'users',
        'auth_role',
        'auth_permission',
        'auth_role_permission',
        'user_role_permission',
        'organization_node'
    ];

    try {
        const result = await prisma.$queryRaw<{ table_name: string }[]>`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY(ARRAY[${requiredTables}])
        `;

        const foundTables = result.map(r => r.table_name);
        tables.push(...foundTables);

        for (const table of requiredTables) {
            if (!foundTables.includes(table)) {
                issues.push(`Missing table: ${table}`);
            }
        }

        // Check users table has required columns
        const userColumns = await prisma.$queryRaw<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'users'
            AND column_name IN ('id', 'email', 'password_hash', 'role', 'token_version')
        `;

        const foundUserCols = userColumns.map(c => c.column_name);
        if (!foundUserCols.includes('token_version')) {
            issues.push('users table missing token_version column');
        }

        // Check user_role_permission has node_id
        const urpColumns = await prisma.$queryRaw<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'user_role_permission'
            AND column_name = 'node_id'
        `;

        if (urpColumns.length === 0) {
            issues.push('user_role_permission table missing node_id column');
        }

    } catch (error) {
        issues.push(`Database query failed: ${error}`);
    }

    return { tables, issues };
}

function scanFile(filePath: string, patterns: RegExp[]): { found: string[]; file: string } {
    const found: string[] = [];
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                found.push(...matches);
            }
        }
    } catch {
        // File not readable
    }
    return { found, file: filePath };
}

function scanDirectory(dir: string, patterns: RegExp[], extensions: string[]): { file: string; found: string[] }[] {
    const results: { file: string; found: string[] }[] = [];

    function walk(currentDir: string) {
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (!entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
                        walk(fullPath);
                    }
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    const result = scanFile(fullPath, patterns);
                    if (result.found.length > 0) {
                        results.push(result);
                    }
                }
            }
        } catch {
            // Directory not accessible
        }
    }

    walk(dir);
    return results;
}

async function runAudit(): Promise<AuditResult> {
    const result: AuditResult = {
        jwt: { pass: true, issues: [] },
        rbac: { pass: true, issues: [] },
        nodeScope: { pass: true, issues: [] },
        evidence: { files: [] }
    };

    console.log('🔍 Running Auth, RBAC & Node Scoping Audit...\n');

    // 1. Check database schema
    console.log('📊 Checking database schema...');
    const dbCheck = await checkDatabaseSchema();
    if (dbCheck.issues.length > 0) {
        result.nodeScope.pass = false;
        result.nodeScope.issues.push(...dbCheck.issues);
    }
    console.log(`   Found tables: ${dbCheck.tables.join(', ')}`);

    // 2. Scan for auth function usage
    console.log('\n📁 Scanning codebase...');
    const srcDir = path.join(process.cwd(), 'src');

    const authPatterns = [
        /verifyAccessTokenLight/g,
        /verifyAccessToken\(/g,
        /requireAuth\(\)/g,
        /can\(session/g,
        /requirePermission/g,
        /withPermission/g
    ];

    const authUsage = scanDirectory(srcDir, authPatterns, ['.ts', '.tsx']);
    console.log(`   Found auth usage in ${authUsage.length} files`);
    result.evidence.files = authUsage.map(r => r.file);

    // 3. Check for node filtering in protected routes
    console.log('\n🔒 Checking node scope enforcement...');
    const routePatterns = [
        /nodeId/g,
        /branchId/g,
        /enforceNodeWhere/g,
        /requireNodeScope/g
    ];

    const apiDir = path.join(srcDir, 'app', 'api');
    const nodeUsage = scanDirectory(apiDir, routePatterns, ['.ts']);

    const protectedRoutes = [
        'users/route.ts',
        'courses/route.ts',
        'assignments/route.ts',
        'learning-paths/route.ts'
    ];

    for (const route of protectedRoutes) {
        const hasNodeFilter = nodeUsage.some(n => n.file.includes(route) && n.found.length > 0);
        if (!hasNodeFilter) {
            result.nodeScope.pass = false;
            result.nodeScope.issues.push(`Route missing node filter: ${route}`);
        }
    }

    // 4. Check JWT verification in auth.ts
    console.log('\n🔐 Checking JWT configuration...');
    const authFile = path.join(srcDir, 'lib', 'auth.ts');
    const jwtPatterns = [
        /HS256/g,
        /setIssuedAt/g,
        /setExpirationTime/g,
        /setIssuer/g,
        /setAudience/g
    ];
    const jwtCheck = scanFile(authFile, jwtPatterns);

    const requiredJwtConfigs = ['HS256', 'setIssuedAt', 'setExpirationTime', 'setIssuer', 'setAudience'];
    for (const config of requiredJwtConfigs) {
        if (!jwtCheck.found.some(f => f.includes(config))) {
            result.jwt.pass = false;
            result.jwt.issues.push(`Missing JWT config: ${config}`);
        }
    }

    // 5. Check RBAC in permissions.ts
    console.log('\n🛡️ Checking RBAC implementation...');
    const permissionsFile = path.join(srcDir, 'lib', 'permissions.ts');
    const rbacPatterns = [
        /authRolePermission/g,
        /IS_PRODUCTION/g,
        /DEFAULT_ROLE_PERMISSIONS/g
    ];
    const rbacCheck = scanFile(permissionsFile, rbacPatterns);

    if (!rbacCheck.found.some(f => f.includes('authRolePermission'))) {
        result.rbac.pass = false;
        result.rbac.issues.push('RBAC not using database (authRolePermission)');
    }

    if (!rbacCheck.found.some(f => f.includes('IS_PRODUCTION'))) {
        result.rbac.pass = false;
        result.rbac.issues.push('Missing production/dev mode check');
    }

    // Output results
    console.log('\n' + '='.repeat(60));
    console.log('AUDIT RESULTS');
    console.log('='.repeat(60));

    console.log(`\nJWT: ${result.jwt.pass ? '✅ PASS' : '❌ FAIL'}`);
    if (result.jwt.issues.length > 0) {
        result.jwt.issues.forEach(i => console.log(`   - ${i}`));
    }

    console.log(`\nRBAC: ${result.rbac.pass ? '✅ PASS' : '❌ FAIL'}`);
    if (result.rbac.issues.length > 0) {
        result.rbac.issues.forEach(i => console.log(`   - ${i}`));
    }

    console.log(`\nNode Scope: ${result.nodeScope.pass ? '✅ PASS' : '❌ FAIL'}`);
    if (result.nodeScope.issues.length > 0) {
        result.nodeScope.issues.forEach(i => console.log(`   - ${i}`));
    }

    console.log('\n' + '='.repeat(60));

    return result;
}

// Run and output JSON
runAudit()
    .then(result => {
        console.log('\n📄 JSON Report:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.jwt.pass && result.rbac.pass && result.nodeScope.pass ? 0 : 1);
    })
    .catch(error => {
        console.error('Audit failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
