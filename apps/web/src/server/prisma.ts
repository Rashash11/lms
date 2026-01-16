import { PrismaClient } from '@prisma/client'
import { getTenantId } from './tenant-context'
import { headers } from 'next/headers'
import { verifyAccessTokenLight } from './auth-definitions'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Models that should NOT be scoped by tenant (global models)
const GLOBAL_MODELS = new Set([
    'tenant',
    'authRole',
    'authPermission',
    'authRolePermission',
    'talentLibraryCourse',
    'userType',
    'passwordResetToken',
    'lRSStatement'
]);

// Models that support soft delete (have deletedAt column)
const SOFT_DELETE_MODELS = new Set([
    'user',
    'course',
    'enrollment',
    'learningPath',
    'group',
    'tenant',
    'branch'
]);

/**
 * Attempt to get tenantId from headers if context is not set.
 * This enables "automatic" scoping for all API routes.
 */
async function getAutomaticTenantId(): Promise<string | undefined> {
    // 1. Try manual context first (highest priority)
    const contextId = getTenantId();
    if (contextId) return contextId;

    // 2. Try to extract from request headers (for unwrapped routes in Next.js)
    try {
        // This may fail in non-request contexts (seed, background jobs, login, etc.)
        const h = await headers();
        const cookieHeader = h.get('cookie') || '';

        if (cookieHeader) {
            const sessionMatch = cookieHeader.match(/session=([^;]+)/);
            if (sessionMatch && sessionMatch[1]) {
                try {
                    const payload = await verifyAccessTokenLight(sessionMatch[1]);
                    if (payload.tenantId) {
                        return payload.tenantId;
                    }
                } catch {
                    // Token verification failed - this is expected for expired/invalid tokens
                    return undefined;
                }
            }
        }
    } catch {
        // Not in a request context or headers not available
        // This is normal for seed scripts, background jobs, login endpoint, etc.
    }
    return undefined;
}

/**
 * Type-safe model validation helpers
 */
function normalizeModelName(model: string): string {
    return model.charAt(0).toLowerCase() + model.slice(1);
}

function isGlobalModel(modelName: string): boolean {
    return GLOBAL_MODELS.has(modelName);
}

function hasSoftDelete(modelName: string): boolean {
    return SOFT_DELETE_MODELS.has(modelName);
}

/**
 * Create hardened Prisma client with multi-tenant isolation
 */
function createPrismaClient() {
    const baseClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['error', 'warn']
            : ['error'],
    }) as any;

    return baseClient.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }: any) {
                    const tenantId = await getAutomaticTenantId();
                    const modelName = normalizeModelName(model);

                    // Skip if model is global
                    if (isGlobalModel(modelName)) {
                        return query(args);
                    }

                    // STRICT MODE: In production, tenant context is REQUIRED for tenant-scoped models
                    const isProduction = process.env.NODE_ENV === 'production';
                    const isSeedMode = process.env.PRISMA_SEED === '1';

                    if (!tenantId && isProduction && !isSeedMode) {
                        logger.error(`[Prisma SECURITY] No tenant context for ${model}.${operation}`);
                        throw new Error(`Tenant context required for ${model}.${operation}`);
                    }

                    // Skip scoping only in seed mode when no tenant
                    if (!tenantId) {
                        return query(args);
                    }

                    // Set PostgreSQL session variable for RLS safety net
                    try {
                        await baseClient.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
                    } catch (e) {
                        if (process.env.NODE_ENV !== 'production') {
                            logger.error('[Prisma] RLS SET failed:', e);
                        }
                    }

                    // Initialize args if needed
                    args = args || {};

                    // 1. Handle READ operations
                    if (['findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                        args.where = { ...args.where, tenantId };

                        // Add soft delete filter if model supports it
                        if (hasSoftDelete(modelName) && args.where.deletedAt === undefined) {
                            args.where.deletedAt = null;
                        }
                    }

                    // 2. Handle findUnique - CRITICAL FIX for GAP-001
                    // Convert to findFirst with tenantId + original conditions to prevent cross-tenant access
                    if (operation === 'findUnique') {
                        const whereClause = { ...args.where, tenantId };

                        // Add soft delete filter
                        if (hasSoftDelete(modelName) && whereClause.deletedAt === undefined) {
                            whereClause.deletedAt = null;
                        }

                        // Use findFirst to allow flexible compound key matching with tenantId
                        const result = await (baseClient[modelName] as any).findFirst({
                            ...args,
                            where: whereClause,
                        });

                        return result;
                    }

                    // 3. Handle UPDATE operations
                    if (['update', 'updateMany'].includes(operation)) {
                        args.where = { ...args.where, tenantId };

                        // Add soft delete filter - don't update deleted records
                        if (hasSoftDelete(modelName) && args.where.deletedAt === undefined) {
                            args.where.deletedAt = null;
                        }

                        // CRITICAL: Never allow tenantId to be changed via update
                        if (args.data?.tenantId && args.data.tenantId !== tenantId) {
                            throw new Error('Cannot change tenantId of existing record');
                        }
                        delete args.data?.tenantId;
                    }

                    // 4. Handle DELETE operations
                    if (['delete', 'deleteMany'].includes(operation)) {
                        args.where = { ...args.where, tenantId };

                        // For soft delete models, convert delete to update
                        if (hasSoftDelete(modelName)) {
                            // Convert to soft delete using updateMany (handles both single and multiple records)
                            return (baseClient[modelName] as any).updateMany({
                                where: { ...args.where },
                                data: { deletedAt: new Date() }
                            });
                        }
                    }

                    // 5. Handle CREATE operations
                    if (operation === 'create') {
                        // Always inject tenantId, never trust client-provided value
                        args.data = { ...args.data, tenantId };
                    }

                    // 6. Handle CREATE MANY operations
                    if (operation === 'createMany') {
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((item: any) => ({
                                ...item,
                                tenantId  // Always inject tenantId
                            }));
                        }
                    }

                    // 7. Handle UPSERT operations
                    if (operation === 'upsert') {
                        args.create = { ...args.create, tenantId };
                        args.where = { ...args.where, tenantId };

                        // CRITICAL: Never allow tenantId change on update portion
                        if (args.update?.tenantId && args.update.tenantId !== tenantId) {
                            throw new Error('Cannot change tenantId of existing record');
                        }
                        delete args.update?.tenantId;
                    }

                    return query(args);
                },
            },
        },
    });
}

// Export the extended client
export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as ReturnType<typeof createPrismaClient>;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Helper to get raw Prisma client (for admin/seed operations that bypass tenant scoping)
 * USE WITH EXTREME CAUTION - only for system-level operations
 */
export function getUnscopedPrisma(): PrismaClient {
    const globalForUnscoped = globalThis as unknown as {
        unscopedPrisma: PrismaClient | undefined
    }
    if (!globalForUnscoped.unscopedPrisma) {
        globalForUnscoped.unscopedPrisma = new PrismaClient({
            log: ['error'],
        });
    }
    return globalForUnscoped.unscopedPrisma;
}

