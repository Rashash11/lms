import fs from 'node:fs';
import path from 'node:path';

export type FrontendRoleGroup =
    | 'public'
    | 'superadmin'
    | 'admin'
    | 'super-instructor'
    | 'instructor'
    | 'learner'
    | 'candidate'
    | 'dashboard'
    | 'other';

export interface FrontendRouteInfo {
    path: string;
    roleGroup: FrontendRoleGroup;
    filePath: string;
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
            findPageFiles(fullPath, out);
            continue;
        }
        if (/^page\.(tsx|ts|jsx|js)$/i.test(entry.name)) out.push(fullPath);
    }
    return out;
}

export function extractFrontendRoutesFromFs(rootDir = process.cwd()): FrontendRouteInfo[] {
    const appDir = path.join(rootDir, 'src', 'app');
    const files = findPageFiles(appDir);
    const routes: FrontendRouteInfo[] = [];

    for (const filePath of files) {
        const relFromApp = toPosix(path.relative(appDir, filePath));
        const routePath = normalizeRoutePath(relFromApp);
        const dynamicSegments = Array.from(routePath.matchAll(/\[[^\]]+\]/g)).map((m) => m[0]);
        routes.push({
            path: routePath,
            roleGroup: getRoleGroup(routePath),
            filePath: toPosix(path.relative(rootDir, filePath)),
            isDynamic: dynamicSegments.length > 0,
            dynamicSegments,
        });
    }

    routes.sort((a, b) => a.path.localeCompare(b.path));
    return routes;
}
