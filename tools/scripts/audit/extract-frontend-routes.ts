import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'src', 'app');

type FrontendRoleGroup =
    | 'public'
    | 'superadmin'
    | 'admin'
    | 'super-instructor'
    | 'instructor'
    | 'learner'
    | 'candidate'
    | 'dashboard'
    | 'other';

interface FrontendRoute {
    path: string;
    filePath: string;
    roleGroup: FrontendRoleGroup;
    isDynamic: boolean;
    dynamicSegments: string[];
}

function toPosix(p: string) {
    return p.replace(/\\/g, '/');
}

function isRouteGroupSegment(segment: string) {
    return segment.startsWith('(') && segment.endsWith(')');
}

function normalizeRoutePath(relativeFromAppDir: string) {
    const noExt = relativeFromAppDir.replace(/(^|\/)page\.(tsx|ts|jsx|js)$/i, '');
    const segments = noExt.split('/').filter(Boolean).filter((s) => !isRouteGroupSegment(s));
    const routePath = '/' + segments.join('/');
    return routePath === '/' ? '/' : routePath.replace(/\/+$/g, '');
}

function getRoleGroup(routePath: string): FrontendRoleGroup {
    if (routePath === '/') return 'public';
    if (routePath.startsWith('/superadmin')) return 'superadmin';
    if (routePath.startsWith('/admin')) return 'admin';
    if (routePath.startsWith('/super-instructor')) return 'super-instructor';
    if (routePath.startsWith('/instructor')) return 'instructor';
    if (routePath.startsWith('/learner')) return 'learner';
    if (routePath.startsWith('/candidates')) return 'dashboard';
    if (routePath === '/candidate' || routePath.startsWith('/candidate/')) return 'candidate';
    if (routePath.startsWith('/dashboard')) return 'dashboard';
    if (routePath === '/courses' || routePath.startsWith('/courses/')) return 'dashboard';
    if (routePath === '/users' || routePath.startsWith('/users/')) return 'dashboard';
    return 'other';
}

function findPageFiles(dir: string, out: string[] = []) {
    if (!fs.existsSync(dir)) return out;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'api') continue;
            if (entry.name === 'node_modules') continue;
            if (entry.name === '.next') continue;
            findPageFiles(fullPath, out);
            continue;
        }
        if (/^page\.(tsx|ts|jsx|js)$/i.test(entry.name)) out.push(fullPath);
    }
    return out;
}

function extractRoutes(): FrontendRoute[] {
    const files = findPageFiles(APP_DIR);
    const routes: FrontendRoute[] = [];
    for (const filePath of files) {
        const rel = toPosix(path.relative(APP_DIR, filePath));
        const routePath = normalizeRoutePath(rel);
        const dynamicSegments = Array.from(routePath.matchAll(/\[[^\]]+\]/g)).map((m) => m[0]);
        routes.push({
            path: routePath,
            filePath: toPosix(path.relative(ROOT_DIR, filePath)),
            roleGroup: getRoleGroup(routePath),
            isDynamic: dynamicSegments.length > 0,
            dynamicSegments,
        });
    }
    routes.sort((a, b) => a.path.localeCompare(b.path));
    return routes;
}

function parseArgs(argv: string[]) {
    const out: { outFile?: string } = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--out' && argv[i + 1]) out.outFile = argv[++i];
    }
    return out;
}

const args = parseArgs(process.argv.slice(2));
const routes = extractRoutes();
const payload = { generatedAt: new Date().toISOString(), routes };
const json = JSON.stringify(payload, null, 2);

if (args.outFile) {
    const outPath = path.isAbsolute(args.outFile) ? args.outFile : path.join(ROOT_DIR, args.outFile);
    fs.writeFileSync(outPath, json);
} else {
    process.stdout.write(json + '\n');
}
