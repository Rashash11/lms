import { describe, it, expect } from 'vitest';
import { getAuthClient } from '../helpers/api-client';
import { POST as createCourseHandler } from '@/app/api/courses/route';

function collectErrorMessages(payload: any): string[] {
    const out: string[] = [];
    const container = payload?.errors ?? payload?.details ?? payload;
    if (Array.isArray(container)) {
        for (const e of container) {
            if (typeof e?.message === 'string') out.push(e.message);
        }
        return out;
    }
    const fieldErrors = container?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
        for (const v of Object.values(fieldErrors)) {
            if (Array.isArray(v)) {
                for (const msg of v) {
                    if (typeof msg === 'string') out.push(msg);
                }
            }
        }
    }
    return out;
}

describe('API Validation (Zod)', () => {
    it('should reject course creation with missing title', async () => {
        const client = await getAuthClient('ADMIN', 'test-tenant');
        client.setCookie('csrf-token', 'token');

        const response = await client.fetch(
            createCourseHandler,
            '/api/courses',
            {
                method: 'POST',
                body: { description: 'Missing title' },
                headers: { 'x-csrf-token': 'token' }
            }
        );

        expect(response.status).toBe(400);
        const data = await response.json();
        console.log('Validation Response:', JSON.stringify(data));
        const messages = collectErrorMessages(data);
        expect(messages.some((m) => /required/i.test(m) || /title/i.test(m))).toBe(true);
    });

    it('should reject course creation with invalid UUID for categoryId', async () => {
        const client = await getAuthClient('ADMIN', 'test-tenant');
        client.setCookie('csrf-token', 'token');

        const response = await client.fetch(
            createCourseHandler,
            '/api/courses',
            {
                method: 'POST',
                body: {
                    title: 'Valid Title',
                    categoryId: 'not-a-uuid'
                },
                headers: { 'x-csrf-token': 'token' }
            }
        );

        expect(response.status).toBe(400);
        const data = await response.json();
        console.log('Validation Response (UUID):', JSON.stringify(data));
        const messages = collectErrorMessages(data);
        expect(messages.some((m) => /invalid/i.test(m) && (/uuid/i.test(m) || /id/i.test(m)))).toBe(true);
    });
});
