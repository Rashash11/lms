import { getCsrfToken } from '@shared/security/csrf';

export class ApiFetchError extends Error {
    status: number;
    details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = 'ApiFetchError';
        this.status = status;
        this.details = details;
    }
}

function isJsonContentType(ct: string | null) {
    if (!ct) return false;
    return ct.includes('application/json') || ct.includes('+json');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object') return false;
    if (value instanceof Date) return false;
    if (value instanceof ArrayBuffer) return false;
    if (typeof FormData !== 'undefined' && value instanceof FormData) return false;
    if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) return false;
    if (typeof Blob !== 'undefined' && value instanceof Blob) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
    body?: BodyInit | Record<string, unknown>;
};

async function readErrorDetails(res: Response): Promise<{ message: string; details?: unknown }> {
    const ct = res.headers.get('content-type');
    if (isJsonContentType(ct)) {
        const data = await res.json().catch(() => undefined);
        if (data && typeof data === 'object') {
            const anyData = data as any;
            const message =
                (typeof anyData.message === 'string' && anyData.message) ||
                (typeof anyData.error === 'string' && anyData.error) ||
                `Request failed with status ${res.status}`;
            return { message, details: data };
        }
    }
    const text = await res.text().catch(() => '');
    const msg = text?.trim();
    return { message: msg ? msg.slice(0, 500) : `Request failed with status ${res.status}` };
}

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers);

    if (!headers.has('accept')) headers.set('accept', 'application/json');

    let body = options.body;
    if (isPlainObject(body)) {
        if (!headers.has('content-type')) headers.set('content-type', 'application/json');
        body = JSON.stringify(body);
    }

    if (typeof window !== 'undefined' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrf = getCsrfToken();
        if (csrf && !headers.has('x-csrf-token')) headers.set('x-csrf-token', csrf);
    }

    const res = await fetch(url, { ...options, method, headers, body });
    if (!res.ok) {
        const { message, details } = await readErrorDetails(res);
        throw new ApiFetchError(message, res.status, details);
    }

    if (res.status === 204) return undefined as T;

    const ct = res.headers.get('content-type');
    if (isJsonContentType(ct)) {
        return (await res.json()) as T;
    }

    return (await res.text()) as unknown as T;
}
