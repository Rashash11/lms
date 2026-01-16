import 'dotenv/config';
import { vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken } from '@/lib/auth-definitions';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
const prisma = new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

// Mock next/headers globally for integration tests
vi.mock('next/headers', () => {
    return {
        cookies: vi.fn(),
    };
});

import { cookies } from 'next/headers';

/**
 * Mocking Next.js request/response for testing API routes directly
 * without starting a full server in every integration test.
 */
export class ApiClient {
    private cookiesStore: Record<string, string> = {};

    constructor(initialCookies: Record<string, string> = {}) {
        this.cookiesStore = initialCookies;
    }

    setCookie(name: string, value: string) {
        this.cookiesStore[name] = value;
    }

    async fetch(
        handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
        url: string,
        options: {
            method?: string;
            body?: any;
            headers?: Record<string, string>;
            params?: any;
        } = {}
    ) {
        const { method = 'GET', body, headers = {}, params } = options;

        if (this.cookiesStore['csrf-token'] && !headers['x-csrf-token']) {
            headers['x-csrf-token'] = this.cookiesStore['csrf-token'];
        }

        console.log('ApiClient Request:', url, method, headers);

        const cookieString = Object.entries(this.cookiesStore)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

        const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
            method,
            headers: {
                ...headers,
                cookie: cookieString,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        // Setup the next/headers cookies() mock for this specific call
        const mockCookieStore = {
            get: (name: string) => {
                const value = this.cookiesStore[name];
                return value ? { name, value } : undefined;
            },
            getAll: () => Object.entries(this.cookiesStore).map(([name, value]) => ({ name, value })),
            set: vi.fn(),
            delete: vi.fn(),
        };

        (cookies as any).mockResolvedValue(mockCookieStore);

        return await handler(req, params ? { params } : undefined);
    }
}

/**
 * Helper to factory a logged-in client for a specific role/tenant
 */
export async function getAuthClient(role: any, tenantId: string, userId: string = 'test-user-id') {
    const client = new ApiClient();

    // Ensure Tenant Exists
    try {
        await prisma.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Test Tenant', domain: `${tenantId}.test`, settings: {} }
        });

        // Ensure User Exists (for Guard check)
        await prisma.user.upsert({
            where: { id: userId },
            update: { activeRole: role }, // Ensure role matches
            create: {
                id: userId,
                tenantId,
                email: `${role.toLowerCase()}@${tenantId}.com`,
                username: `test_${role}_${userId.substring(0, 8)}`,
                firstName: 'Test',
                lastName: role,
                activeRole: role as any,
                status: 'ACTIVE',
                tokenVersion: 0
            }
        });
    } catch (e) {
        // Ignore unique constraint errors or connection issues during parallel tests
        console.warn('DB upsert failed in getAuthClient:', e);
    }

    // Generate a REAL signed JWT that will pass signature verification
    const token = await signAccessToken({
        userId,
        email: `${role.toLowerCase()}@${tenantId}.com`,
        activeRole: role as any,
        tenantId,
        tokenVersion: 0
    });
    console.log('Generated Token:', token);

    client.setCookie('session', token);
    client.setCookie('csrf-token', 'test-csrf-token'); // Default CSRF token
    return client;
}
