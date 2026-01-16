
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();

interface RouteAudit {
    file: string;
    path: string;
    methods: string[];
    isDynamic: boolean;
    hasGuard: boolean;
    hasValidation: boolean;
    issues: string[];
}

function isPublicOrNonSensitiveRoute(apiPath: string) {
    return (
        apiPath.includes('/auth/') ||
        apiPath.includes('/health') ||
        apiPath.includes('/upload') ||
        apiPath.includes('/csrf-token') ||
        apiPath.includes('/e2e/ready') ||
        apiPath.includes('/vite/') ||
        apiPath.includes('/env') ||
        apiPath.includes('/api/[...catchall]') ||
        apiPath.includes('/_debug/')
    );
}

function findRouteFiles(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findRouteFiles(filePath, fileList);
        } else {
            if (file === 'route.ts' || file === 'route.tsx') {
                // Keep relative path from ROOT_DIR
                fileList.push(path.relative(ROOT_DIR, filePath).replace(/\\/g, '/'));
            }
        }
    });
    
    return fileList;
}

async function auditRoutes() {
    console.log('🔍 Starting API Route Audit...');
    
    const apiDir = path.join(ROOT_DIR, 'apps', 'web', 'src', 'app', 'api');
    const files = findRouteFiles(apiDir);
    
    console.log(`Found ${files.length} route files.`);
    
    const results: RouteAudit[] = [];
    
    for (const file of files) {
        const fullPath = path.join(ROOT_DIR, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Determine API path from file path
        // apps/web/src/app/api/foo/route.ts -> /api/foo
        const apiPath = '/' + file
            .replace(/^apps\/web\/src\/app\//, '')
            .replace(/\/route\.(ts|tsx)$/, '');
            
        const audit: RouteAudit = {
            file,
            path: apiPath,
            methods: [],
            isDynamic: false,
            hasGuard: false,
            hasValidation: false,
            issues: []
        };
        
        // 1. Check Methods
        const methodMatches = content.match(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/g);
        if (methodMatches) {
            audit.methods = methodMatches.map(m => m.match(/(GET|POST|PUT|PATCH|DELETE)/)![0]);
        }
        
        // 2. Check Dynamic Config
        if (content.includes("export const dynamic = 'force-dynamic'")) {
            audit.isDynamic = true;
        } else if (content.includes("export const dynamic = 'force-static'")) {
            // Explicit static is fine
        }
        
        // 3. Check Guard
        if (content.includes('withGuard') || content.includes('apiGuard')) {
            audit.hasGuard = true;
        } else {
            if (!isPublicOrNonSensitiveRoute(apiPath)) {
                audit.issues.push('Missing "withGuard" (potentially unprotected)');
            }
        }
        
        // 4. Check Validation
        if (content.includes('z.object') || content.includes('validateBody') || content.includes('validateQuery') || content.includes('zod')) {
            audit.hasValidation = true;
        } else {
            const readsBody =
                /request\.json\(|req\.json\(/.test(content) ||
                /request\.formData\(|req\.formData\(/.test(content);
            if (readsBody && audit.methods.some(m => ['POST', 'PUT', 'PATCH'].includes(m))) {
                audit.issues.push('Missing Zod validation (parses body)');
            }
        }
        
        results.push(audit);
    }
    
    // Print Report
    console.log('\n📊 Route Audit Report\n');
    console.table(results.map(r => ({
        path: r.path,
        methods: r.methods.join(','),
        dynamic: r.isDynamic ? '✅' : '❓',
        guard: r.hasGuard ? '✅' : '⚠️',
        zod: r.hasValidation ? '✅' : '⚠️',
        issues: r.issues.length
    })));
    
    // Print Issues
    const problems = results.filter(r => r.issues.length > 0);
    if (problems.length > 0) {
        console.log(`\n⚠️ Found ${problems.length} routes with potential issues:\n`);
        problems.forEach(p => {
            console.log(`\n📂 ${p.file}`);
            console.log(`   📍 ${p.path}`);
            p.issues.forEach(i => console.log(`   cx ${i}`));
        });
    }

    const criticalProblems = results.filter(r =>
        r.issues.some(i => i.includes('Missing "withGuard"'))
    );
    if (criticalProblems.length > 0) {
        console.log(`\n❌ Found ${criticalProblems.length} routes with critical issues.\n`);
        process.exit(1);
    }

    console.log('\n✅ No critical routing issues found.');
}

auditRoutes().catch(console.error);
