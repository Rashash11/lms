
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

function fixRoutes() {
    console.log('🔧 Fixing Dynamic Route Configs...');
    
    const apiDir = path.join(ROOT_DIR, 'src/app/api');
    const files = findRouteFiles(apiDir);
    
    let fixedCount = 0;
    
    for (const filePath of files) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let changed = false;
        
        // Check if needs dynamic
        const usesDynamicFeatures = 
            content.includes('cookies()') || 
            content.includes('headers()') || 
            content.includes('request.url') ||
            content.includes('req.url') ||
            content.includes('NextRequest');
            
        const hasGet = content.includes('export async function GET') || content.includes('export function GET') || content.includes('export const GET');
        
        if (usesDynamicFeatures && hasGet) {
            if (!content.includes('export const dynamic')) {
                // Insert at the top after imports
                const lines = content.split('\n');
                let insertIndex = 0;
                
                // Skip imports
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith('import ') || lines[i].trim() === '' || lines[i].startsWith('//')) {
                        insertIndex = i + 1;
                    } else {
                        break;
                    }
                }
                
                lines.splice(insertIndex, 0, "\nexport const dynamic = 'force-dynamic';");
                content = lines.join('\n');
                changed = true;
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`✅ Fixed dynamic config in: ${path.relative(ROOT_DIR, filePath)}`);
            fixedCount++;
        }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} files.`);
}

fixRoutes();
