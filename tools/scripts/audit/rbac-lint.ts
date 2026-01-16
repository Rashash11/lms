import fs from 'fs';
import path from 'path';
import { ALL_PERMISSIONS } from '../../../apps/web/src/server/permissions-registry';

const SRC_DIR = path.join(process.cwd(), 'apps', 'web', 'src');
const PERMISSION_REGEX = /(?:can|requirePermission)\s*\(\s*(?:[^,]+,)?\s*['"]([^'"]+)['"]\s*\)/g;
const HOOK_REGEX = /can\s*\(\s*['"]([^'"]+)['"]\s*\)/g; // For usePermissions hook

function getFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                getFiles(name, fileList);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            fileList.push(name);
        }
    }
    return fileList;
}

function lint() {
    console.log('🔍 Scanning codebase for RBAC permission strings...');
    const files = getFiles(SRC_DIR);
    const usedPermissions = new Map<string, string[]>();
    const registeredPermissions = new Set(ALL_PERMISSIONS as unknown as string[]);

    for (const file of files) {
        // Skip registry and hook definition themselves
        if (file.endsWith('permissions-registry.ts') || file.endsWith('usePermissions.ts')) continue;

        const content = fs.readFileSync(file, 'utf8');
        // Simple heuristic to skip comments for basic matches (not perfect but helps)
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

            let match;
            // Match can(session, 'perm') or requirePermission('perm') or can('perm')
            while ((match = PERMISSION_REGEX.exec(line)) !== null) {
                const perm = match[1];
                if (!usedPermissions.has(perm)) usedPermissions.set(perm, []);
                usedPermissions.get(perm)!.push(`${path.relative(process.cwd(), file)}:${index + 1}`);
            }
            while ((match = HOOK_REGEX.exec(line)) !== null) {
                const perm = match[1];
                if (!usedPermissions.has(perm)) usedPermissions.set(perm, []);
                usedPermissions.get(perm)!.push(`${path.relative(process.cwd(), file)}:${index + 1}`);
            }
        });
    }

    const missing = Array.from(usedPermissions.keys()).filter(p => !registeredPermissions.has(p));

    if (missing.length > 0) {
        console.log('\n❌ RBAC DRIFT DETECTED!');
        console.log('The following permissions are used in code but NOT registered in ALL_PERMISSIONS:');
        for (const perm of missing) {
            console.log(`\n- "${perm}"`);
            const locations = usedPermissions.get(perm)!;
            const uniqueLocations = [...new Set(locations)];
            for (const loc of uniqueLocations) {
                console.log(`  📍 ${loc}`);
            }
        }
        console.log('\nFIX: Add these permissions to ALL_PERMISSIONS in src/lib/permissions.ts');
        process.exit(1);
    }

    console.log(`\n✅ RBAC LINT PASSED: ${usedPermissions.size} unique permissions verified.`);
    process.exit(0);
}

lint();
