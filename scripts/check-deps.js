const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
    'react', 'react-dom', 'next', 'prisma', '@prisma/client', // common built-ins or already checked
    // Node.js built-ins
    'fs', 'path', 'crypto', 'os', 'http', 'https', 'stream', 'util', 'events', 'zlib', 'url', 'querystring'
]);

// Add common sub-paths and built-ins that use slashes
dependencies.add('fs/promises');
dependencies.add('stream/promises');
dependencies.add('util/types');

// Add Next.js internals that are common
dependencies.add('next/server');
dependencies.add('next/headers');
dependencies.add('next/navigation');
dependencies.add('next/cache');

const failures = [];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /from ['"]([^@.][^'"]*)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Get the base package name (e.g., @mui/material -> @mui/material, lodash/clone -> lodash)
        const parts = importPath.split('/');
        const packageName = importPath.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

        if (!dependencies.has(packageName) && !packageName.startsWith('@/')) {
            failures.push({
                file: filePath,
                package: packageName,
                fullImport: importPath
            });
        }
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                walk(fullPath);
            }
        } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
            checkFile(fullPath);
        }
    }
}

console.log('--- Checking for undeclared dependencies ---');
walk('src');

if (failures.length > 0) {
    console.error('\n❌ Found imports from packages not listed in package.json:\n');
    failures.forEach(f => {
        console.error(`- ${f.file}: "${f.fullImport}" (Package: ${f.package})`);
    });
    console.log('\nTip: Run "npm install <package-name>" to fix these.');
    process.exit(1);
} else {
    console.log('\n✅ All imports are declared in package.json.');
    process.exit(0);
}
