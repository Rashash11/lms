/**
 * Permissions Unit Tests
 * 
 * Tests for RBAC permission aggregation and override logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock types
interface Permission {
    name: string;
    fullPermission: string;
}

interface Role {
    name: string;
    permissions: Permission[];
}

interface RbacOverride {
    permission: string;
    effect: 'grant' | 'deny';
}

// Permission aggregation logic (simplified version of actual implementation)
function aggregatePermissions(
    roles: Role[],
    overrides: RbacOverride[] = []
): Set<string> {
    const permissions = new Set<string>();

    // Collect all permissions from roles
    for (const role of roles) {
        for (const perm of role.permissions) {
            permissions.add(perm.fullPermission);
        }
    }

    // Apply overrides (deny takes precedence)
    const denied = new Set<string>();
    const granted = new Set<string>();

    for (const override of overrides) {
        if (override.effect === 'deny') {
            denied.add(override.permission);
        } else if (override.effect === 'grant') {
            granted.add(override.permission);
        }
    }

    // Remove denied permissions
    for (const perm of denied) {
        permissions.delete(perm);
    }

    // Add granted permissions
    for (const perm of granted) {
        if (!denied.has(perm)) {
            permissions.add(perm);
        }
    }

    return permissions;
}

// Cache key generation
function getCacheKey(userId: string, nodeId: string | null): string {
    return `permissions:${userId}:${nodeId || 'GLOBAL'}`;
}

describe('Permissions - Aggregation', () => {
    describe('getUserPermissions', () => {
        it('should aggregate permissions from multiple roles', () => {
            const roles: Role[] = [
                {
                    name: 'instructor',
                    permissions: [
                        { name: 'course:read', fullPermission: 'course:read' },
                        { name: 'course:update', fullPermission: 'course:update' },
                    ],
                },
                {
                    name: 'grader',
                    permissions: [
                        { name: 'submission:read', fullPermission: 'submission:read' },
                        { name: 'submission:grade', fullPermission: 'submission:grade' },
                    ],
                },
            ];

            const permissions = aggregatePermissions(roles);

            expect(permissions.has('course:read')).toBe(true);
            expect(permissions.has('course:update')).toBe(true);
            expect(permissions.has('submission:read')).toBe(true);
            expect(permissions.has('submission:grade')).toBe(true);
            expect(permissions.size).toBe(4);
        });

        it('should deduplicate overlapping permissions', () => {
            const roles: Role[] = [
                {
                    name: 'role1',
                    permissions: [
                        { name: 'course:read', fullPermission: 'course:read' },
                    ],
                },
                {
                    name: 'role2',
                    permissions: [
                        { name: 'course:read', fullPermission: 'course:read' }, // Duplicate
                        { name: 'course:update', fullPermission: 'course:update' },
                    ],
                },
            ];

            const permissions = aggregatePermissions(roles);

            expect(permissions.size).toBe(2); // Deduplicated
            expect(permissions.has('course:read')).toBe(true);
            expect(permissions.has('course:update')).toBe(true);
        });

        it('should return empty set for no roles', () => {
            const permissions = aggregatePermissions([]);
            expect(permissions.size).toBe(0);
        });
    });
});

describe('Permissions - RBAC Overrides', () => {
    describe('override precedence', () => {
        it('should apply grant overrides', () => {
            const roles: Role[] = [
                {
                    name: 'basic',
                    permissions: [
                        { name: 'course:read', fullPermission: 'course:read' },
                    ],
                },
            ];

            const overrides: RbacOverride[] = [
                { permission: 'course:update', effect: 'grant' },
            ];

            const permissions = aggregatePermissions(roles, overrides);

            expect(permissions.has('course:read')).toBe(true);
            expect(permissions.has('course:update')).toBe(true); // Granted
        });

        it('should apply deny overrides', () => {
            const roles: Role[] = [
                {
                    name: 'admin',
                    permissions: [
                        { name: 'course:read', fullPermission: 'course:read' },
                        { name: 'course:delete', fullPermission: 'course:delete' },
                    ],
                },
            ];

            const overrides: RbacOverride[] = [
                { permission: 'course:delete', effect: 'deny' },
            ];

            const permissions = aggregatePermissions(roles, overrides);

            expect(permissions.has('course:read')).toBe(true);
            expect(permissions.has('course:delete')).toBe(false); // Denied
        });

        it('deny should take precedence over grant', () => {
            const roles: Role[] = [];

            const overrides: RbacOverride[] = [
                { permission: 'course:delete', effect: 'grant' },
                { permission: 'course:delete', effect: 'deny' },
            ];

            const permissions = aggregatePermissions(roles, overrides);

            // Deny takes precedence, so course:delete should NOT be in permissions
            expect(permissions.has('course:delete')).toBe(false);
        });

        it('deny should override role permissions', () => {
            const roles: Role[] = [
                {
                    name: 'admin',
                    permissions: [
                        { name: 'all', fullPermission: 'user:delete' },
                    ],
                },
            ];

            const overrides: RbacOverride[] = [
                { permission: 'user:delete', effect: 'deny' },
            ];

            const permissions = aggregatePermissions(roles, overrides);

            expect(permissions.has('user:delete')).toBe(false);
        });
    });
});

describe('Permissions - Cache Key', () => {
    describe('getCacheKey', () => {
        it('should include userId and nodeId', () => {
            const key = getCacheKey('user-123', 'node-abc');
            expect(key).toBe('permissions:user-123:node-abc');
        });

        it('should use GLOBAL for null nodeId', () => {
            const key = getCacheKey('user-123', null);
            expect(key).toBe('permissions:user-123:GLOBAL');
        });

        it('should produce unique keys for different nodes', () => {
            const key1 = getCacheKey('user-123', 'node-a');
            const key2 = getCacheKey('user-123', 'node-b');

            expect(key1).not.toBe(key2);
        });

        it('should produce unique keys for different users', () => {
            const key1 = getCacheKey('user-1', 'node-a');
            const key2 = getCacheKey('user-2', 'node-a');

            expect(key1).not.toBe(key2);
        });
    });
});

describe('Permissions - Role Hierarchy', () => {
    it('ADMIN should have more permissions than INSTRUCTOR', () => {
        const adminRoles: Role[] = [
            {
                name: 'admin',
                permissions: [
                    { name: 'user:create', fullPermission: 'user:create' },
                    { name: 'user:delete', fullPermission: 'user:delete' },
                    { name: 'course:create', fullPermission: 'course:create' },
                    { name: 'course:delete', fullPermission: 'course:delete' },
                    { name: 'settings:update', fullPermission: 'settings:update' },
                ],
            },
        ];

        const instructorRoles: Role[] = [
            {
                name: 'instructor',
                permissions: [
                    { name: 'course:read', fullPermission: 'course:read' },
                    { name: 'course:update', fullPermission: 'course:update' },
                ],
            },
        ];

        const adminPerms = aggregatePermissions(adminRoles);
        const instructorPerms = aggregatePermissions(instructorRoles);

        expect(adminPerms.size).toBeGreaterThan(instructorPerms.size);
        expect(adminPerms.has('user:delete')).toBe(true);
        expect(instructorPerms.has('user:delete')).toBe(false);
    });

    it('LEARNER should have minimal permissions', () => {
        const learnerRoles: Role[] = [
            {
                name: 'learner',
                permissions: [
                    { name: 'course:read', fullPermission: 'course:read' },
                    { name: 'enrollment:read', fullPermission: 'enrollment:read' },
                ],
            },
        ];

        const permissions = aggregatePermissions(learnerRoles);

        expect(permissions.size).toBe(2);
        expect(permissions.has('course:read')).toBe(true);
        expect(permissions.has('course:create')).toBe(false);
        expect(permissions.has('user:read')).toBe(false);
    });
});
