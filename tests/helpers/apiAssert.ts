import type { Page, Request, Response, TestInfo } from '@playwright/test';
import { z } from 'zod';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiLogEntry {
    url: string;
    method: ApiMethod;
    status?: number;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: unknown;
    responseBody?: unknown;
    failure?: string;
}

export interface ApiContractEntry {
    id: string;
    match: RegExp;
    methods?: ApiMethod[];
    expectedStatus?: number | number[];
    expectedContentType?: RegExp;
    responseSchema?: z.ZodTypeAny;
    allowNonJson?: boolean;
    allowFailureStatuses?: number[];
    skipCsrfCheck?: boolean;
}

export interface ApiObserverOptions {
    failOnConsoleNetwork4xx5xx?: boolean;
}

export interface ApiObserver {
    entries: ApiLogEntry[];
    assertClean: () => Promise<void>;
}

function toMethod(method: string): ApiMethod {
    return method.toUpperCase() as ApiMethod;
}

function headerGet(headers: Record<string, string>, key: string) {
    const lower = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === lower) return v;
    }
    return undefined;
}

function isJsonContentType(ct: string | undefined) {
    if (!ct) return false;
    return ct.includes('application/json') || ct.includes('+json');
}

function isHtmlContentType(ct: string | undefined) {
    if (!ct) return false;
    return ct.includes('text/html');
}

function normalizeUrlPath(url: string) {
    try {
        const u = new URL(url);
        return u.pathname + (u.search || '');
    } catch {
        return url;
    }
}

function safeJsonParse(text: string) {
    try {
        return { ok: true as const, value: JSON.parse(text) };
    } catch (e: any) {
        return { ok: false as const, error: String(e?.message || e) };
    }
}

function requestBodyHasTenantId(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(requestBodyHasTenantId);
    if (Object.prototype.hasOwnProperty.call(value, 'tenantId')) return true;
    for (const v of Object.values(value as Record<string, unknown>)) {
        if (requestBodyHasTenantId(v)) return true;
    }
    return false;
}

function urlHasTenantIdQuery(pathWithQuery: string) {
    try {
        const u = new URL('http://local' + pathWithQuery);
        return u.searchParams.has('tenantId') || u.searchParams.has('tenant');
    } catch {
        return /tenantId=|tenant=/i.test(pathWithQuery);
    }
}

export const apiContracts: ApiContractEntry[] = [
    {
        id: 'auth.login',
        match: /^\/api\/auth\/login$/,
        methods: ['POST'],
        expectedStatus: [200, 400, 401, 403],
        expectedContentType: /application\/json/i,
        responseSchema: z.object({ ok: z.boolean() }).passthrough(),
        skipCsrfCheck: false,
    },
    {
        id: 'auth.me',
        match: /^\/api\/me$/,
        methods: ['GET'],
        expectedStatus: 200,
        expectedContentType: /application\/json/i,
        responseSchema: z.object({ user: z.any().optional() }).passthrough(),
    },
    {
        id: 'users.list',
        match: /^\/api\/users$/,
        methods: ['GET'],
        expectedStatus: [200, 401, 403],
        expectedContentType: /application\/json/i,
        responseSchema: z.object({ data: z.array(z.any()).optional() }).passthrough(),
    },
    {
        id: 'users.mutate',
        match: /^\/api\/users(\/[^/]+)?$/,
        methods: ['POST', 'PUT', 'DELETE'],
        expectedStatus: [200, 201, 204, 400, 401, 403, 404, 409],
        expectedContentType: /application\/json/i,
        responseSchema: z.any().optional(),
    },
    {
        id: 'catalog',
        match: /^\/api\/catalog$/,
        methods: ['GET'],
        expectedStatus: [200, 401, 403],
        expectedContentType: /application\/json/i,
        responseSchema: z.object({ data: z.array(z.any()).optional() }).passthrough(),
    },
    {
        id: 'reports.export.training-progress',
        match: /^\/api\/reports\/export\/training-progress$/,
        methods: ['POST'],
        expectedStatus: [200, 401, 403],
        expectedContentType: /(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/octet-stream)/i,
        allowNonJson: true,
    },
    {
        id: 'courses.detail',
        match: /^\/api\/courses\/[^/]+$/,
        methods: ['GET'],
        expectedStatus: [200, 401, 403, 404],
        expectedContentType: /application\/json/i,
        responseSchema: z.object({ id: z.string() }).passthrough(),
    },
    {
        id: 'instructor.courses.list',
        match: /^\/api\/instructor\/courses$/,
        methods: ['GET'],
        expectedStatus: [200, 401, 403],
        expectedContentType: /application\/json/i,
        responseSchema: z.object({ courses: z.array(z.any()).optional() }).passthrough(),
    },
    {
        id: 'learner.progress',
        match: /^\/api\/learner\/progress$/,
        methods: ['GET'],
        expectedStatus: [200, 400, 401, 403, 404],
        expectedContentType: /application\/json/i,
        responseSchema: z.object({ courseId: z.string().optional() }).passthrough(),
    },
];

function findContract(pathWithQuery: string, method: ApiMethod) {
    const pathOnly = pathWithQuery.split('?')[0];
    for (const c of apiContracts) {
        if (!c.match.test(pathOnly)) continue;
        if (c.methods && !c.methods.includes(method)) continue;
        return c;
    }
    return undefined;
}

async function tryReadRequestBody(request: Request) {
    const postData = request.postData();
    if (!postData) return undefined;
    const contentType = headerGet(request.headers(), 'content-type');
    if (contentType?.includes('application/json')) {
        const parsed = safeJsonParse(postData);
        if (parsed.ok) return parsed.value;
        return postData;
    }
    return postData;
}

async function maybeReadResponseBody(response: Response, responseHeaders: Record<string, string>, contract?: ApiContractEntry) {
    const contentType = headerGet(responseHeaders, 'content-type');
    if (contract?.allowNonJson) return undefined;
    if (!isJsonContentType(contentType)) return undefined;
    try {
        return await response.json();
    } catch {
        const text = await response.text().catch(() => '');
        if (!text.trim()) return undefined;
        const parsed = safeJsonParse(text);
        if (parsed.ok) return parsed.value;
        return { __invalidJson: true, error: parsed.error, text: text.slice(0, 500) };
    }
}

export function attachApiObserver(page: Page, testInfo: TestInfo, options: ApiObserverOptions = {}): ApiObserver {
    const entries: ApiLogEntry[] = [];
    const failures: string[] = [];
    const failOnNetwork = options.failOnConsoleNetwork4xx5xx ?? true;

    const onRequestFailed = (request: Request) => {
        const url = request.url();
        if (!url.includes('/api/')) return;
        const errorText = request.failure()?.errorText || '';
        if (/ERR_ABORTED|aborted/i.test(errorText)) return;
        entries.push({
            url: normalizeUrlPath(url),
            method: toMethod(request.method()),
            requestHeaders: request.headers(),
            failure: `requestfailed: ${errorText || 'unknown'}`,
        });
        failures.push(`Network failure: ${url}`);
    };

    const onResponse = async (response: Response) => {
        const request = response.request();
        const url = request.url();
        if (!url.includes('/api/')) return;

        const method = toMethod(request.method());
        const urlPath = normalizeUrlPath(url);
        const requestHeaders = request.headers();
        const responseHeaders = response.headers();
        const status = response.status();
        const contract = findContract(urlPath, method);

        const entry: ApiLogEntry = {
            url: urlPath,
            method,
            status,
            requestHeaders,
            responseHeaders,
        };

        const contentType = headerGet(responseHeaders, 'content-type');
        if (isHtmlContentType(contentType)) {
            entry.failure = `HTML response from API (content-type: ${contentType || 'missing'})`;
        }
        if (urlHasTenantIdQuery(urlPath)) {
            entry.failure = entry.failure || 'API request included tenant context in query params';
        }

        if (!contract) {
            if (failOnNetwork && status >= 400) {
                entry.failure = entry.failure || `Unexpected API status ${status}`;
            }
        } else {
            if (!contract.skipCsrfCheck && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                const csrf = headerGet(requestHeaders, 'x-csrf-token');
                if (!csrf) entry.failure = entry.failure || 'Missing x-csrf-token header on mutation';
            }

            if (contract.expectedStatus) {
                const expected = Array.isArray(contract.expectedStatus) ? contract.expectedStatus : [contract.expectedStatus];
                if (!expected.includes(status)) {
                    entry.failure = entry.failure || `Expected status ${expected.join(',')} but got ${status}`;
                }
            } else if (failOnNetwork && status >= 400) {
                const allowed = contract.allowFailureStatuses || [];
                if (!allowed.includes(status)) entry.failure = entry.failure || `Unexpected API status ${status}`;
            }

            if (contract.expectedContentType && contentType && !contract.expectedContentType.test(contentType)) {
                entry.failure = entry.failure || `Unexpected content-type ${contentType}`;
            }
        }

        entry.requestBody = await tryReadRequestBody(request);
        if (requestBodyHasTenantId(entry.requestBody)) {
            entry.failure = entry.failure || 'API request included tenantId in request body';
        }
        entry.responseBody = await maybeReadResponseBody(response, responseHeaders, contract);
        if ((entry.responseBody as any)?.__invalidJson) {
            entry.failure = entry.failure || 'Invalid JSON response body';
        }

        if (contract?.responseSchema && entry.responseBody !== undefined) {
            const result = contract.responseSchema.safeParse(entry.responseBody);
            if (!result.success) {
                entry.failure = entry.failure || `Response schema mismatch: ${result.error.message}`;
            }
        }

        entries.push(entry);
        if (entry.failure) failures.push(`${method} ${urlPath}: ${entry.failure}`);
    };

    page.on('requestfailed', onRequestFailed);
    page.on('response', onResponse);

    const assertClean = async () => {
        page.off('requestfailed', onRequestFailed);
        page.off('response', onResponse);

        if (failures.length) {
            const top = entries
                .filter((e) => e.failure || (e.status !== undefined && e.status >= 400))
                .slice(0, 10);

            await testInfo.attach('api-log.json', {
                body: Buffer.from(JSON.stringify({ entries, top }, null, 2)),
                contentType: 'application/json',
            });
            throw new Error(`API/network issues detected:\n${failures.slice(0, 10).join('\n')}`);
        }
    };

    return { entries, assertClean };
}
