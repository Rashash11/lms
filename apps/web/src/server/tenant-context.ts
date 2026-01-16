import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
    tenantId?: string;
    userId?: string;
}

export const tenantContext = new AsyncLocalStorage<TenantStore>();

/**
 * Helper to run a function within a tenant context.
 */
export function withTenantContext<T>(store: TenantStore, fn: () => T): T {
    return tenantContext.run(store, fn);
}

/**
 * Get current tenantId from context.
 */
export function getTenantId(): string | undefined {
    return tenantContext.getStore()?.tenantId;
}
