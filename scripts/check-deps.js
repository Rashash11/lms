const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const declared = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
]);

const builtins = new Set(Module.builtinModules);
for (const b of Module.builtinModules) {
    if (b.startsWith('node:')) builtins.add(b.slice('node:'.length));
}

const INTERNAL_PREFIXES = ['@/', '@modules/', '@shared/'];

const failures = [];

function isInternalImport(spec) {
    return INTERNAL_PREFIXES.some((p) => spec.startsWith(p));
}

function isRelative(spec) {
    return spec.startsWith('.') || spec.startsWith('/');
}

function basePackageName(spec) {
    if (spec.startsWith('node:')) return 'node';
    const parts = spec.split('/');
    if (spec.startsWith('@')) return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
    return parts[0];
}

function recordFailure(filePath, fullImport) {
    const pkg = basePackageName(fullImport);
    if (!pkg) return;
    if (isRelative(fullImport) || isInternalImport(fullImport)) return;
    if (builtins.has(pkg) || builtins.has(fullImport) || pkg === 'node') return;
    if (declared.has(pkg)) return;
    failures.push({ file: filePath, package: pkg, fullImport });
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    const patterns = [
        /^\s*import\s+.+?\sfrom\s+['"]([^'"]+)['"]/gm,
        /^\s*import\s+['"]([^'"]+)['"]/gm,
        /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const re of patterns) {
        let match;
        while ((match = re.exec(content)) !== null) {
            recordFailure(filePath, match[1]);
        }
    }
}

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (
                entry.name === 'node_modules' ||
                entry.name === '.next' ||
                entry.name === 'dist' ||
                entry.name === 'build' ||
                entry.name === '_archive' ||
                entry.name === '.trae' ||
                entry.name === '.gemini' ||
                entry.name === '.agent' ||
                (fullPath.includes(path.join('tools', 'scripts')) && entry.name === 'fix')
            ) {
                continue;
            }
            walk(fullPath);
            continue;
        }
        if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) continue;
        checkFile(fullPath);
    }
}

console.log('--- Checking for undeclared dependencies ---');

const targets = [
    path.join(ROOT, 'apps', 'web', 'src'),
    path.join(ROOT, 'scripts'),
    path.join(ROOT, 'tools', 'scripts'),
    path.join(ROOT, 'tests'),
];

for (const t of targets) {
    if (fs.existsSync(t)) walk(t);
}

if (failures.length > 0) {
    console.error('\n❌ Found imports from packages not listed in package.json:\n');
    for (const f of failures) {
        console.error(`- ${f.file}: "${f.fullImport}" (Package: ${f.package})`);
    }
    process.exit(1);
}

console.log('\n✅ All imports are declared in package.json.');
