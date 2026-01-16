import { expect } from '@playwright/test';
import { signAccessToken } from '../../src/lib/auth-definitions';

// Helper to generate auth state for Playwright tests
// This allows us to bypass the UI login flow and set cookies directly
// saving massive amounts of time in E2E tests.

export const TEST_USERS = {
    ADMIN: {
        email: 'admin@zedny.com',
        role: 'ADMIN',
        tenantId: 'default-tenant-id'
    },
    INSTRUCTOR: {
        email: 'instructor@zedny.com',
        role: 'INSTRUCTOR',
        tenantId: 'default-tenant-id'
    },
    LEARNER: {
        email: 'learner@zedny.com',
        role: 'LEARNER',
        tenantId: 'default-tenant-id'
    }
};

export async function generateAuthCookie(role: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER', tenantId: string = 'default-tenant-id') {
    const user = TEST_USERS[role];
    
    // Create a valid JWT
    const token = await signAccessToken({
        userId: `test-${role.toLowerCase()}-id`,
        email: user.email,
        activeRole: role,
        tenantId: tenantId,
        tokenVersion: 0
    });

    return {
        name: 'session',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const
    };
}
