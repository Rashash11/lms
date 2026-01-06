// API Routing Audit Script

const fs = require('fs');
const path = require('path');

function findAllApiRoutes(dir) {
    const routes = [];

    function scanDir(currentPath, apiPath = '') {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                // Map [id] to :id for comparison
                const segment = entry.name.startsWith('[') ? ':id' : entry.name;
                scanDir(fullPath, apiPath + '/' + entry.name);
            } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
                routes.push({
                    path: '/api' + apiPath,
                    file: fullPath.replace(/\\/g, '/')
                });
            }
        }
    }

    scanDir(dir);
    return routes;
}

function extractFetchCalls(content) {
    const regex = /fetch\s*\(\s*['"`]\/api\/([^'"`]+)['"`]/g;
    const calls = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        calls.push('/api/' + match[1]);
    }

    return calls;
}

function scanFrontendCalls(dir) {
    const calls = new Set();

    function scanDir(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                scanDir(fullPath);
            } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const extracted = extractFetchCalls(content);
                    extracted.forEach(call => calls.add(call));
                } catch (e) {
                    // Ignore read errors
                }
            }
        }
    }

    scanDir(dir);
    return Array.from(calls);
}

console.log('\n=== STEP 4: API ROUTING AUDIT ===\n');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const srcDir = path.join(__dirname, '..', 'src');

console.log('Scanning API routes...');
const apiRoutes = findAllApiRoutes(apiDir);
console.log(`Found ${apiRoutes.length} API route files\n`);

console.log('Scanning frontend fetch calls...');
const frontendCalls = scanFrontendCalls(srcDir);
console.log(`Found ${frontendCalls.length} unique API calls\n`);

// Normalize paths for comparison
function normalizePath(p) {
    return p.replace(/\[id\]/g, ':id').replace(/\[.*?\]/g, ':param');
}

const routeSet = new Set(apiRoutes.map(r => normalizePath(r.path)));

console.log('=== POTENTIAL MISMATCHES ===\n');

let mismatches = 0;
frontendCalls.sort().forEach(call => {
    const normalized = normalizePath(call);
    const exists = Array.from(routeSet).some(route => {
        // Simple match or parameterized match
        return route === normalized ||
            route.replace(/:[^/]+/g, '(.+)') === normalized.replace(/:[^/]+/g, '(.+)');
    });

    if (!exists && !call.includes('${')) {
        console.log(`❌ MISSING: ${call}`);
        mismatches++;
    }
});

if (mismatches === 0) {
    console.log('✓ All frontend calls have corresponding API routes\n');
}

console.log('\n=== SAMPLE API ROUTES ===');
apiRoutes.slice(0, 20).forEach(r => {
    console.log(`${r.path} -> ${r.file.substring(r.file.indexOf('src'))}`);
});
