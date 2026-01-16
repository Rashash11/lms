
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function findRouteFiles(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findRouteFiles(filePath, fileList);
        } else {
            if (file === 'route.ts' || file === 'route.tsx') {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function getGuardConfig(apiPath: string, method: string): string | null {
    // 1. Auth/Public routes - skip
    if (apiPath.startsWith('/api/auth')) return null;
    if (apiPath.startsWith('/api/health')) return null;
    if (apiPath.startsWith('/api/upload')) return null;
    if (apiPath.startsWith('/api/env')) return null;
    if (apiPath.startsWith('/api/webhooks')) return null;
    if (apiPath.startsWith('/api/_debug')) return null;

    // 2. Admin routes
    if (apiPath.startsWith('/api/admin')) return `{ roles: ['ADMIN'] }`;

    // 3. Instructor routes
    if (apiPath.startsWith('/api/instructor')) return `{ roles: ['INSTRUCTOR', 'ADMIN'] }`;
    if (apiPath.startsWith('/api/super-instructor')) return `{ roles: ['SUPER_INSTRUCTOR', 'ADMIN'] }`;

    // 4. Learner specific routes
    if (apiPath.startsWith('/api/learner')) return `{ roles: ['LEARNER'] }`;

    // 5. Domain specific routes - map to permissions
    // Courses
    if (apiPath.startsWith('/api/courses')) {
        if (method === 'GET') return `{ permission: 'course:read' }`;
        return `{ permission: 'course:update' }`;
    }
    
    // Learning Paths
    if (apiPath.startsWith('/api/learning-paths')) {
        if (method === 'GET') return `{ permission: 'learning_path:read' }`;
        return `{ permission: 'learning_path:update' }`;
    }

    // Assignments
    if (apiPath.startsWith('/api/assignments')) {
        if (method === 'GET') return `{ permission: 'assignment:read' }`;
        return `{ permission: 'assignment:update' }`;
    }

    // Users
    if (apiPath.startsWith('/api/users')) {
        if (method === 'GET') return `{ permission: 'user:read' }`;
        return `{ permission: 'user:update' }`;
    }
    
    // Enrollments
    if (apiPath.startsWith('/api/enrollments')) {
        return `{ permission: 'enrollment:read' }`;
    }

    // Skills
    if (apiPath.startsWith('/api/skills')) {
        if (method === 'GET') return `{ permission: 'skill:read' }`;
        return `{ permission: 'skill:update' }`; 
    }

    // Reports
    if (apiPath.startsWith('/api/reports')) {
        return `{ permission: 'report:read' }`;
    }

    // Notifications (general)
    if (apiPath.startsWith('/api/notifications')) {
        return `{}`; // Just require auth
    }

    // Submissions
    if (apiPath.startsWith('/api/submissions')) {
        if (method === 'GET') return `{ permission: 'submission:read' }`;
        return `{ permission: 'submission:update' }`;
    }

    // Default: Just require authentication
    return `{}`;
}

function fixRoutes() {
    console.log('🛡️  Fixing Missing Guards (Multi-line Robust)...');
    
    const apiDir = path.join(ROOT_DIR, 'src/app/api');
    const files = findRouteFiles(apiDir);
    
    let fixedCount = 0;
    
    for (const filePath of files) {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Skip if already has guard
        if (content.includes('withGuard') || content.includes('apiGuard')) {
            continue;
        }

        const relPath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
        const apiPath = '/' + relPath
            .replace(/^src\/app\//, '')
            .replace(/\/route\.ts$/, '');
            
        // Add import
        if (!content.includes("@/lib/api-guard")) {
            content = "import { withGuard } from '@/lib/api-guard';\n" + content;
        }

        const regex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([\s\S]*?)\)\s*\{/g;
        let match;
        let lastIndex = 0;
        let newContentParts: string[] = [];
        let changed = false;

        // Reset regex
        regex.lastIndex = 0;
        
        // We can't just replace because we need to find the matching closing brace for the function body.
        // So we iterate through matches.
        
        let cursor = 0;
        
        while ((match = regex.exec(content)) !== null) {
            const fullMatch = match[0];
            const method = match[1];
            const args = match[2];
            const startIndex = match.index;
            const openBraceIndex = startIndex + fullMatch.length - 1; // The { is at the end
            
            const guardConfig = getGuardConfig(apiPath, method);
            
            if (guardConfig === null) {
                continue;
            }

            // Push content before this match
            // But wait, if we have multiple matches, we need to handle them sequentially.
            // The issue is regex.exec loop doesn't account for the body length.
            // We need to find the end of the function body to update regex.lastIndex or just manually parse.
            
            // Let's assume we find the body end.
            let braceCount = 1;
            let i = openBraceIndex + 1;
            while (i < content.length && braceCount > 0) {
                if (content[i] === '{') braceCount++;
                if (content[i] === '}') braceCount--;
                i++;
            }
            
            const bodyEndIndex = i; // This is the index after the closing }
            const originalBodyContent = content.substring(openBraceIndex + 1, bodyEndIndex - 1);
            
            // Extract the first argument name for withGuard(req, ...)
            const argName = args.split(':')[0].trim().split(',')[0].trim();
            
            // Construct replacement
            // We keep the signature
            // We wrap the body
            
            // Wait, we can't easily inline the body if it has return statements that we want to capture?
            // `withGuard` returns the result of the callback.
            // So `return withGuard(..., async () => { originalBody })` works.
            
            const newBody = `
    return withGuard(${argName}, ${guardConfig}, async () => {
${originalBodyContent}
    });
`;

            // We need to replace the content from openBraceIndex to bodyEndIndex with `{ newBody }`
            // But we can't modify `content` while iterating.
            // We'll build `newContent` piece by piece.
            
            newContentParts.push(content.substring(cursor, openBraceIndex));
            newContentParts.push('{');
            newContentParts.push(newBody);
            newContentParts.push('}');
            
            cursor = bodyEndIndex;
            regex.lastIndex = cursor;
            changed = true;
        }
        
        newContentParts.push(content.substring(cursor));
        
        if (changed) {
            fs.writeFileSync(filePath, newContentParts.join(''), 'utf-8');
            console.log(`✅ Fixed guards in: ${path.relative(ROOT_DIR, filePath)}`);
            fixedCount++;
        }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} files.`);
}

fixRoutes();
