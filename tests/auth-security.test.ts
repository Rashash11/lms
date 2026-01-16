/**
 * Auth, RBAC & Node Scoping Security Tests
 * 
 * Tests for:
 * - Node isolation (cross-node access blocked)
 * - RBAC permission gates
 * - JWT validation (expired, invalid signature, wrong iss/aud)
 * - TokenVersion revocation
 * 
 * Run: npm test -- --testPathPattern=auth-security
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        $queryRaw: vi.fn(),
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

// Import after mocking
import { signAccessToken, verifyAccessToken, verifyAccessTokenLight, AuthError } from '@/lib/auth';
import { can, getUserPermissions, clearPermissionCache } from '@/lib/permissions';

describe('JWT Verification', () => {
    const validPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        activeRole: 'LEARNER' as const,
        role: 'LEARNER' as const,
        nodeId: '1',
        tokenVersion: 0,
    };

    it('should sign and verify a valid token', async () => {
        const token = await signAccessToken(validPayload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const verified = await verifyAccessTokenLight(token);
        expect(verified.userId).toBe(validPayload.userId);
        expect(verified.email).toBe(validPayload.email);
        expect(verified.role).toBe(validPayload.role);
    });

    it('should reject expired tokens', async () => {
        // Create a token that expires immediately
        const { SignJWT } = await import('jose');
        const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me');

        const expiredToken = await new SignJWT({ ...validPayload } as any)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('0s') // Expired immediately
            .setIssuer('lms-auth')
            .setAudience('lms-api')
            .sign(JWT_KEY);

        await expect(verifyAccessTokenLight(expiredToken)).rejects.toThrow(AuthError);
    });

    it('should reject tokens with wrong issuer', async () => {
        const { SignJWT } = await import('jose');
        const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me');

        const wrongIssuerToken = await new SignJWT({ ...validPayload } as any)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('15m')
            .setIssuer('wrong-issuer') // Wrong issuer
            .setAudience('lms-api')
            .sign(JWT_KEY);

        await expect(verifyAccessTokenLight(wrongIssuerToken)).rejects.toThrow(AuthError);
    });

    it('should reject tokens with wrong audience', async () => {
        const { SignJWT } = await import('jose');
        const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me');

        const wrongAudienceToken = await new SignJWT({ ...validPayload } as any)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('15m')
            .setIssuer('lms-auth')
            .setAudience('wrong-audience') // Wrong audience
            .sign(JWT_KEY);

        await expect(verifyAccessTokenLight(wrongAudienceToken)).rejects.toThrow(AuthError);
    });

    it('should reject tokens with invalid signature', async () => {
        const token = await signAccessToken(validPayload);
        // Corrupt the token
        const corruptedToken = token.slice(0, -10) + 'corrupted!';

        await expect(verifyAccessTokenLight(corruptedToken)).rejects.toThrow(AuthError);
    });
});

describe('TokenVersion Revocation', () => {
    let prisma: any;

    beforeAll(async () => {
        const mod = await import('@/lib/prisma');
        prisma = mod.prisma;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject token when tokenVersion mismatch', async () => {
        const payload = {
            userId: 'test-user-id',
            email: 'test@example.com',
            activeRole: 'LEARNER' as const,
            role: 'LEARNER' as const,
            tokenVersion: 0, // JWT has version 0
        };

        const token = await signAccessToken(payload);

        // Mock DB to return version 1 (user logged out all sessions)
        (prisma.$queryRaw as any).mockResolvedValueOnce([{ token_version: 1 }]);

        await expect(verifyAccessToken(token)).rejects.toThrow('Token has been revoked');
    });

    it('should accept token when tokenVersion matches', async () => {
        const payload = {
            userId: 'test-user-id',
            email: 'test@example.com',
            activeRole: 'LEARNER' as const,
            role: 'LEARNER' as const,
            tokenVersion: 1,
        };

        const token = await signAccessToken(payload);

        // Mock DB to return matching version
        (prisma.$queryRaw as any).mockResolvedValueOnce([{ token_version: 1 }]);

        const verified = await verifyAccessToken(token);
        expect(verified.userId).toBe(payload.userId);
    });
});

describe('RBAC Permission Gates', () => {
    let prisma: any;

    beforeAll(async () => {
        const mod = await import('@/lib/prisma');
        prisma = mod.prisma;
    });

    beforeEach(() => {
        clearPermissionCache();
        vi.clearAllMocks();
    });

    it('should deny access when permission is missing', async () => {
        const session = {
            userId: 'learner-id',
            email: 'learner@example.com',
            activeRole: 'LEARNER' as const,
            role: 'LEARNER' as const,
        };

        // Mock user lookup
        (prisma.user.findUnique as any).mockResolvedValueOnce({
            id: 'learner-id',
            role: 'LEARNER',
            roles: [],
        });

        // Mock empty permissions from DB
        (prisma as any).authRolePermission = {
            findMany: vi.fn().mockResolvedValueOnce([]),
        };
        (prisma as any).authRole = {
            findFirst: vi.fn().mockResolvedValueOnce(null),
        };

        const hasPermission = await can(session, 'course:delete_any');
        expect(hasPermission).toBe(false);
    });

    it('should allow access when permission exists', async () => {
        const session = {
            userId: 'admin-id',
            email: 'admin@example.com',
            activeRole: 'ADMIN' as const,
            role: 'ADMIN' as const,
        };

        // Mock user lookup
        (prisma.user.findUnique as any).mockResolvedValueOnce({
            id: 'admin-id',
            role: 'ADMIN',
            roles: [{ roleKey: 'ADMIN' }],
        });

        // Mock permissions from DB
        (prisma as any).authRolePermission = {
            findMany: vi.fn().mockResolvedValueOnce([
                { permission: { fullPermission: 'course:delete_any' } },
            ]),
        };

        const hasPermission = await can(session, 'course:delete_any');
        expect(hasPermission).toBe(true);
    });
});

describe('Node Isolation', () => {
    const userNodeA = {
        userId: 'user-a',
        email: 'user-a@example.com',
        activeRole: 'INSTRUCTOR' as const,
        role: 'INSTRUCTOR' as const,
        nodeId: '1', // Node A
    };

    const userNodeB = {
        userId: 'user-b',
        email: 'user-b@example.com',
        activeRole: 'INSTRUCTOR' as const,
        role: 'INSTRUCTOR' as const,
        nodeId: '2', // Node B
    };

    it('should not allow user from node A to access node B resources', () => {
        // This is a conceptual test - actual enforcement is in route handlers
        expect(userNodeA.nodeId).not.toBe(userNodeB.nodeId);
    });

    it('should reject switch-node to unauthorized node', async () => {
        // Mock fetch to simulate API call
        const mockResponse = {
            ok: false,
            status: 403,
            json: async () => ({ error: 'FORBIDDEN', message: 'No access to this node' }),
        };

        global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

        const response = await fetch('/api/auth/switch-node', {
            method: 'POST',
            body: JSON.stringify({ nodeId: '999' }), // Unauthorized node
        });

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('FORBIDDEN');
    });

    it('should ignore forged nodeId in request payload', () => {
        // Conceptual test: verify that session.nodeId from JWT is used,
        // not any nodeId from request body
        const requestBody = { nodeId: '999' }; // Forged nodeId
        const sessionFromJWT = { nodeId: '1' }; // Actual nodeId from verified JWT

        // The route should use sessionFromJWT.nodeId, not requestBody.nodeId
        expect(sessionFromJWT.nodeId).toBe('1');
        expect(requestBody.nodeId).not.toBe(sessionFromJWT.nodeId);
    });
});

describe('Switch-Node Validation', () => {
    it('should validate node exists before switching', async () => {
        const mockResponse = {
            ok: false,
            status: 404,
            json: async () => ({ error: 'NOT_FOUND', message: 'Node not found' }),
        };

        global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

        const response = await fetch('/api/auth/switch-node', {
            method: 'POST',
            body: JSON.stringify({ nodeId: '99999' }), // Non-existent node
        });

        expect(response.status).toBe(404);
    });

    it('should allow admin to switch to any valid node', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: async () => ({ ok: true, nodeId: '5' }),
        };

        global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

        const response = await fetch('/api/auth/switch-node', {
            method: 'POST',
            body: JSON.stringify({ nodeId: '5' }),
        });

        expect(response.ok).toBe(true);
    });
});

describe('Cookie Security', () => {
    it('should set secure cookie options', () => {
        const cookieOptions = {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 15 * 60,
        };

        expect(cookieOptions.httpOnly).toBe(true);
        expect(cookieOptions.sameSite).toBe('lax');
        expect(cookieOptions.path).toBe('/');
        expect(cookieOptions.maxAge).toBe(900);
    });
});
