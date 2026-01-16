
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

function auditValidation() {
    console.log('🔍 Auditing Validation...');
    
    const apiDir = path.join(ROOT_DIR, 'src/app/api');
    const files = findRouteFiles(apiDir);
    
    const issues: string[] = [];
    
    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check if it reads body
        if (content.includes('.json()')) {
            // Check if it has validation
            if (!content.includes('z.object') && !content.includes('validateBody') && !content.includes('zod')) {
                issues.push(path.relative(ROOT_DIR, filePath));
            }
        }
    }
    
    if (issues.length > 0) {
        console.log(`\n❌ Found ${issues.length} routes reading JSON without apparent Zod validation:\n`);
        issues.forEach(f => console.log(`   ${f}`));
    } else {
        console.log('\n✅ No validation issues found (heuristic).');
    }
}

auditValidation();
