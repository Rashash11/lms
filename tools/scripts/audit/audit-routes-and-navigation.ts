/**
 * Route Audit Script - Comprehensive Navigation Validator
 * 
 * This script:
 * 1. Scans filesystem for all page.tsx and route.ts files
 * 2. Extracts navigation targets from source (Link, router.push, etc.)
 * 3. Validates all navigation destinations exist
 * 4. Outputs markdown + JSON reports
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface RouteInfo {
    path: string;
    filePath: string;
    isDynamic: boolean;
    dynamicSegments: string[];
}

interface NavigationTarget {
    href: string;
    type: 'Link' | 'router.push' | 'router.replace' | 'redirect' | 'window.location' | 'menu-item';
    sourceFile: string;
    line?: number;
}

interface ValidationResult {
    href: string;
    valid: boolean;
    reason?: string;
    matchedRoute?: string;
}

interface AuditReport {
    timestamp: string;
    pages: RouteInfo[];
    apis: RouteInfo[];
    linksFound: NavigationTarget[];
    validatedLinks: ValidationResult[];
    missingRoutes: ValidationResult[];
    suspiciousRoutes: ValidationResult[];
    externalLinks: string[];
    summary: {
        pass: boolean;
        totalPages: number;
        totalApis: number;
        totalLinks: number;
        validLinks: number;
        missingRoutes: number;
        externalLinks: number;
    };
}

const APP_DIR = path.join(process.cwd(), 'src', 'app');
const SRC_DIR = path.join(process.cwd(), 'src');

// Sample values for dynamic segments
const DYNAMIC_FIXTURES: Record<string, string> = {
    '[id]': 'test-id',
    '[courseId]': '1',
    '[unitId]': '1',
    '[enrollmentId]': '1',
    '[sectionId]': '1',
    '[requestId]': '1',
    '[queueId]': '1',
    '[section]': 'test-section',
    '[key]': 'test-key',
    '[...slug]': 'test',
};

/**
 * Recursively find all files matching a pattern
 */
function findFiles(dir: string, pattern: RegExp, results: string[] = []): string[] {
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Skip node_modules, .next, .git
            if (!['node_modules', '.next', '.git', '.github'].includes(entry.name)) {
                findFiles(fullPath, pattern, results);
            }
        } else if (pattern.test(entry.name)) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * Convert file path to route path
 * e.g., src/app/(admin)/admin/users/page.tsx -> /admin/users
 */
function filePathToRoute(filePath: string): RouteInfo {
    // Get relative path from app directory
    let relativePath = path.relative(APP_DIR, filePath);

    // Replace backslashes with forward slashes (Windows)
    relativePath = relativePath.replace(/\\/g, '/');

    // Remove page.tsx or route.ts
    relativePath = relativePath.replace(/(\/page\.tsx|\/route\.ts)$/, '');

    // Remove route groups (parentheses)
    relativePath = relativePath.replace(/\([^)]+\)\//g, '');

    // Handle root route
    if (relativePath === '' || relativePath === 'page') {
        relativePath = '/';
    } else if (relativePath === 'page.tsx' || relativePath.endsWith('/page.tsx')) {
        // Handle edge case where page.tsx is the remaining path
        relativePath = relativePath.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '');
        relativePath = relativePath === '' ? '/' : '/' + relativePath;
    } else {
        relativePath = '/' + relativePath;
    }

    // Find dynamic segments
    const dynamicSegments: string[] = [];
    const dynamicMatch = relativePath.match(/\[[^\]]+\]/g);
    if (dynamicMatch) {
        dynamicSegments.push(...dynamicMatch);
    }

    return {
        path: relativePath,
        filePath: path.relative(process.cwd(), filePath),
        isDynamic: dynamicSegments.length > 0,
        dynamicSegments,
    };
}

/**
 * Extract navigation targets from source code
 */
function extractNavigationTargets(filePath: string): NavigationTarget[] {
    const targets: NavigationTarget[] = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativeFilePath = path.relative(process.cwd(), filePath);

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Skip comment lines
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
            return;
        }

        // <Link href="...">
        const linkMatches = line.matchAll(/href=["'`]([^"'`]+)["'`]/g);
        for (const match of linkMatches) {
            targets.push({
                href: match[1],
                type: 'Link',
                sourceFile: relativeFilePath,
                line: lineNum,
            });
        }

        // router.push("...") or router.replace("...")
        const routerMatches = line.matchAll(/router\.(push|replace)\s*\(\s*["'`]([^"'`]+)["'`]/g);
        for (const match of routerMatches) {
            targets.push({
                href: match[2],
                type: match[1] === 'push' ? 'router.push' : 'router.replace',
                sourceFile: relativeFilePath,
                line: lineNum,
            });
        }

        // redirect("...")
        const redirectMatches = line.matchAll(/redirect\s*\(\s*["'`]([^"'`]+)["'`]/g);
        for (const match of redirectMatches) {
            targets.push({
                href: match[1],
                type: 'redirect',
                sourceFile: relativeFilePath,
                line: lineNum,
            });
        }

        // window.location.href = "..."
        const windowMatches = line.matchAll(/window\.location\.href\s*=\s*["'`]([^"'`]+)["'`]/g);
        for (const match of windowMatches) {
            targets.push({
                href: match[1],
                type: 'window.location',
                sourceFile: relativeFilePath,
                line: lineNum,
            });
        }

        // Menu items with path: '/...'
        const menuPathMatches = line.matchAll(/path:\s*["'`]([^"'`]+)["'`]/g);
        for (const match of menuPathMatches) {
            if (match[1].startsWith('/')) {
                targets.push({
                    href: match[1],
                    type: 'menu-item',
                    sourceFile: relativeFilePath,
                    line: lineNum,
                });
            }
        }
    });

    return targets;
}

/**
 * Check if a href matches any route
 */
function validateHref(href: string, pages: RouteInfo[], apis: RouteInfo[]): ValidationResult {
    // External links
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return { href, valid: true, reason: 'external' };
    }

    // Hash links or javascript:
    if (href.startsWith('#') || href.startsWith('javascript:')) {
        return { href, valid: true, reason: 'hash-or-js' };
    }

    // Template literals with variables
    if (href.includes('${') || href.includes('`')) {
        return { href, valid: true, reason: 'dynamic-template' };
    }

    // Normalize href
    let normalizedHref = href.split('?')[0]; // Remove query params
    normalizedHref = normalizedHref.split('#')[0]; // Remove hash

    // Check static pages
    const allRoutes = [...pages, ...apis];

    // First, check exact match
    for (const route of allRoutes) {
        if (route.path === normalizedHref) {
            return { href, valid: true, matchedRoute: route.path };
        }
    }

    // Check dynamic routes
    for (const route of allRoutes) {
        if (route.isDynamic) {
            // Create regex from route pattern
            let pattern = route.path;
            for (const segment of route.dynamicSegments) {
                if (segment.startsWith('[...')) {
                    // Catch-all
                    pattern = pattern.replace(segment, '.+');
                } else {
                    // Single dynamic segment
                    pattern = pattern.replace(segment, '[^/]+');
                }
            }
            const regex = new RegExp(`^${pattern}$`);
            if (regex.test(normalizedHref)) {
                return { href, valid: true, matchedRoute: route.path };
            }
        }
    }

    // Special cases - API routes often have different patterns
    if (normalizedHref.startsWith('/api/')) {
        // Check if base API route exists
        const baseRoute = normalizedHref.replace(/\/[^/]+$/, '');
        for (const route of apis) {
            if (route.path === baseRoute || route.path.startsWith(baseRoute)) {
                return { href, valid: true, matchedRoute: route.path, reason: 'api-base-match' };
            }
        }
    }

    return { href, valid: false, reason: 'no-matching-route' };
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: AuditReport): string {
    const lines: string[] = [];

    lines.push('# Route Audit Report');
    lines.push('');
    lines.push(`Generated: ${report.timestamp}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Pages | ${report.summary.totalPages} |`);
    lines.push(`| Total API Routes | ${report.summary.totalApis} |`);
    lines.push(`| Total Navigation Links | ${report.summary.totalLinks} |`);
    lines.push(`| Valid Links | ${report.summary.validLinks} |`);
    lines.push(`| Missing Routes | ${report.summary.missingRoutes} |`);
    lines.push(`| External Links | ${report.summary.externalLinks} |`);
    lines.push('');
    lines.push(`**Overall Status: ${report.summary.pass ? '✅ PASS' : '❌ FAIL'}**`);
    lines.push('');

    // Missing Routes (problems)
    if (report.missingRoutes.length > 0) {
        lines.push('## ❌ Missing Routes');
        lines.push('');
        lines.push('These navigation targets point to routes that do not exist:');
        lines.push('');
        lines.push('| href | Found in |');
        lines.push('|------|----------|');
        for (const item of report.missingRoutes) {
            const target = report.linksFound.find(l => l.href === item.href);
            lines.push(`| \`${item.href}\` | ${target?.sourceFile || 'unknown'}:${target?.line || '?'} |`);
        }
        lines.push('');
    }

    // Page Routes
    lines.push('## Page Routes');
    lines.push('');
    lines.push('| Route | File | Dynamic |');
    lines.push('|-------|------|---------|');
    for (const route of report.pages) {
        lines.push(`| \`${route.path}\` | ${route.filePath} | ${route.isDynamic ? route.dynamicSegments.join(', ') : '-'} |`);
    }
    lines.push('');

    // API Routes
    lines.push('## API Routes');
    lines.push('');
    lines.push('| Route | File | Dynamic |');
    lines.push('|-------|------|---------|');
    for (const route of report.apis) {
        lines.push(`| \`${route.path}\` | ${route.filePath} | ${route.isDynamic ? route.dynamicSegments.join(', ') : '-'} |`);
    }
    lines.push('');

    // Navigation Links (abbreviated)
    lines.push('## Navigation Links Found');
    lines.push('');
    lines.push(`Total: ${report.linksFound.length} links across ${new Set(report.linksFound.map(l => l.sourceFile)).size} files`);
    lines.push('');

    // Group by file
    const byFile = new Map<string, NavigationTarget[]>();
    for (const target of report.linksFound) {
        if (!byFile.has(target.sourceFile)) {
            byFile.set(target.sourceFile, []);
        }
        byFile.get(target.sourceFile)!.push(target);
    }

    // Show top files with most links
    const sortedFiles = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20);
    lines.push('### Top Files by Link Count');
    lines.push('');
    lines.push('| File | Links |');
    lines.push('|------|-------|');
    for (const [file, links] of sortedFiles) {
        lines.push(`| ${file} | ${links.length} |`);
    }
    lines.push('');

    return lines.join('\n');
}

/**
 * Main execution
 */
async function main() {
    console.log('🔍 Starting Route Audit...\n');

    // 1. Find all page routes
    console.log('📄 Scanning for page routes...');
    const pageFiles = findFiles(APP_DIR, /page\.tsx$/);
    const pages = pageFiles.map(filePathToRoute);
    console.log(`   Found ${pages.length} page routes\n`);

    // 2. Find all API routes
    console.log('🔌 Scanning for API routes...');
    const apiFiles = findFiles(APP_DIR, /route\.ts$/);
    const apis = apiFiles.map(filePathToRoute);
    console.log(`   Found ${apis.length} API routes\n`);

    // 3. Find all source files with potential navigation
    console.log('🔗 Scanning for navigation targets...');
    const sourceFiles = findFiles(SRC_DIR, /\.(tsx?|jsx?)$/);
    const allTargets: NavigationTarget[] = [];

    for (const file of sourceFiles) {
        const targets = extractNavigationTargets(file);
        allTargets.push(...targets);
    }

    // Deduplicate by href
    const uniqueTargets = allTargets.filter((target, index, self) =>
        index === self.findIndex(t => t.href === target.href)
    );
    console.log(`   Found ${allTargets.length} total links (${uniqueTargets.length} unique)\n`);

    // 4. Validate all targets
    console.log('✅ Validating navigation targets...');
    const validatedLinks: ValidationResult[] = [];
    const missingRoutes: ValidationResult[] = [];
    const externalLinks: string[] = [];

    for (const target of uniqueTargets) {
        const result = validateHref(target.href, pages, apis);
        validatedLinks.push(result);

        if (result.reason === 'external') {
            externalLinks.push(target.href);
        } else if (!result.valid) {
            missingRoutes.push(result);
        }
    }

    console.log(`   Valid: ${validatedLinks.filter(v => v.valid).length}`);
    console.log(`   Missing: ${missingRoutes.length}`);
    console.log(`   External: ${externalLinks.length}\n`);

    // 5. Build report
    const report: AuditReport = {
        timestamp: new Date().toISOString(),
        pages,
        apis,
        linksFound: allTargets,
        validatedLinks,
        missingRoutes,
        suspiciousRoutes: [],
        externalLinks,
        summary: {
            pass: missingRoutes.length === 0,
            totalPages: pages.length,
            totalApis: apis.length,
            totalLinks: uniqueTargets.length,
            validLinks: validatedLinks.filter(v => v.valid).length,
            missingRoutes: missingRoutes.length,
            externalLinks: externalLinks.length,
        },
    };

    // 6. Output reports
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    // Markdown report
    const mdReport = generateMarkdownReport(report);
    fs.writeFileSync(path.join(docsDir, 'routing-audit.md'), mdReport);
    console.log('📝 Written: docs/routing-audit.md');

    // JSON report
    fs.writeFileSync(
        path.join(process.cwd(), 'routing-audit-report.json'),
        JSON.stringify(report, null, 2)
    );
    console.log('📊 Written: routing-audit-report.json');

    // Print summary
    console.log('\n' + '='.repeat(50));
    if (report.summary.pass) {
        console.log('✅ AUDIT PASSED - All navigation targets are valid');
    } else {
        console.log('❌ AUDIT FAILED - Found missing routes:');
        for (const missing of missingRoutes.slice(0, 10)) {
            const target = allTargets.find(t => t.href === missing.href);
            console.log(`   - ${missing.href} (${target?.sourceFile}:${target?.line})`);
        }
        if (missingRoutes.length > 10) {
            console.log(`   ... and ${missingRoutes.length - 10} more`);
        }
    }
    console.log('='.repeat(50));

    // Exit with error code if failed
    process.exit(report.summary.pass ? 0 : 1);
}

main().catch(console.error);
