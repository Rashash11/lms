
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_FILES = [
    'src/app/api/instructor/job-roles/route.ts',
    'src/app/api/instructor/recommendations/candidates/route.ts',
    'src/app/api/instructor/reports/overview/route.ts',
    'src/app/api/reports/overview/route.ts',
    'src/app/api/reports/timeline/route.ts',
    'src/app/api/reports/training-matrix/route.ts',
    'src/app/api/user-types/route.ts',
    'src/app/api/users/search/route.ts',
    'src/app/api/env/route.ts',
    'src/app/api/_debug/db/route.ts'
];

function fixDynamic() {
    console.log('🔧 Fixing specific dynamic routes...');
    
    let count = 0;
    for (const relPath of TARGET_FILES) {
        const fullPath = path.join(ROOT_DIR, relPath);
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            if (!content.includes("export const dynamic")) {
                // Insert after imports
                const lines = content.split('\n');
                let insertIndex = 0;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith('import ') || lines[i].trim() === '' || lines[i].startsWith('//')) {
                        insertIndex = i + 1;
                    } else {
                        break;
                    }
                }
                
                lines.splice(insertIndex, 0, "\nexport const dynamic = 'force-dynamic';");
                fs.writeFileSync(fullPath, lines.join('\n'), 'utf-8');
                console.log(`✅ Fixed: ${relPath}`);
                count++;
            }
        } else {
            console.log(`⚠️  File not found: ${relPath}`);
        }
    }
    console.log(`Done. Fixed ${count} files.`);
}

fixDynamic();
