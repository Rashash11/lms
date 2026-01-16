
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

function fixBrokenImports() {
    console.log('🚑 Fixing broken imports...');
    
    const apiDir = path.join(ROOT_DIR, 'src/app/api');
    const files = findRouteFiles(apiDir);
    
    let fixedCount = 0;
    
    for (const filePath of files) {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for the specific broken pattern: export const dynamic inside import
        // The pattern seen in logs:
        // import {
        // export const dynamic = 'force-dynamic';
        //     withGuard,
        
        if (content.match(/import\s*{[^}]*export const dynamic/)) {
            console.log(`Fixing: ${path.relative(ROOT_DIR, filePath)}`);
            
            // Remove the misplaced line
            content = content.replace(/\nexport const dynamic = 'force-dynamic';/g, '');
            content = content.replace(/\nexport const dynamic = "force-dynamic";/g, '');
            
            // Add it back at the end of imports
            // Find the last import
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                // Find the end of this import statement
                // It ends with ; or newline?
                // It's safer to put it after the last 'from ...;'
                
                // Let's just put it before the first export function/const (except dynamic)
                const firstExport = content.match(/export (async )?function/);
                if (firstExport) {
                    const idx = firstExport.index!;
                    content = content.slice(0, idx) + "\nexport const dynamic = 'force-dynamic';\n\n" + content.slice(idx);
                } else {
                    // Fallback: append to top? No, after imports.
                    // Let's assume after the last '}' of imports or last ';'.
                    // This is hard.
                    
                    // Simple regex for last import line
                    // We can look for `from '...';`
                    const lastFrom = content.lastIndexOf("from '");
                    if (lastFrom !== -1) {
                        const endOfLine = content.indexOf('\n', lastFrom);
                        const insertPos = endOfLine !== -1 ? endOfLine + 1 : content.length;
                        content = content.slice(0, insertPos) + "\nexport const dynamic = 'force-dynamic';\n" + content.slice(insertPos);
                    }
                }
            }
            
            fs.writeFileSync(filePath, content, 'utf-8');
            fixedCount++;
        }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} broken files.`);
}

fixBrokenImports();
