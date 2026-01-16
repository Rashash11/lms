import { extractFrontendRoutesFromFs, type FrontendRouteInfo } from '../e2e/helpers/route-list';
import { getDynamicRoutes, staticRoutes } from '../e2e/fixtures/routes';

export type ScanRole = 'superadmin' | 'admin' | 'super-instructor' | 'instructor' | 'learner' | 'candidate' | 'dashboard' | 'public';

export function getAllFrontendRoutes() {
    return extractFrontendRoutesFromFs();
}

export function getRoleRoutes(role: ScanRole): string[] {
    const discovered = getAllFrontendRoutes()
        .filter((r: FrontendRouteInfo) => r.roleGroup === role)
        .map((r) => r.path)
        .filter((p) => !p.includes('['));

    const staticForRole = (staticRoutes as any)[role] as string[] | undefined;

    const dynamic = getDynamicRoutes();
    const dynForRole = (dynamic as any)[role] ? Object.values((dynamic as any)[role]) : [];
    const dynamicRoutes = (dynForRole.filter((v) => typeof v === 'string') as string[])
        .filter((p) => !p.includes('['));

    return Array.from(new Set([...(staticForRole || []), ...discovered, ...dynamicRoutes])).sort();
}

