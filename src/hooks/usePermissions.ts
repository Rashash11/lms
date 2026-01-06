'use client';

import { useState, useEffect, useCallback } from 'react';

interface PermissionsState {
    permissions: string[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const CACHE_TTL = 60000; // 60 seconds

let globalCache: PermissionsState = {
    permissions: [],
    loading: false,
    error: null,
    lastFetched: null,
};

export function usePermissions() {
    const [state, setState] = useState<PermissionsState>(globalCache);

    const fetchPermissions = useCallback(async (force = false) => {
        // Return cached if still valid
        if (!force && globalCache.lastFetched && Date.now() - globalCache.lastFetched < CACHE_TTL) {
            setState(globalCache);
            return;
        }

        // Don't refetch if already loading
        if (globalCache.loading) return;

        globalCache = { ...globalCache, loading: true };
        setState(globalCache);

        try {
            const res = await fetch('/api/auth/permissions', {
                credentials: 'include',
            });

            if (!res.ok) {
                if (res.status === 401) {
                    globalCache = {
                        permissions: [],
                        loading: false,
                        error: 'Not authenticated',
                        lastFetched: Date.now(),
                    };
                } else {
                    globalCache = {
                        permissions: [],
                        loading: false,
                        error: 'Failed to load permissions',
                        lastFetched: Date.now(),
                    };
                }
            } else {
                const data = await res.json();
                globalCache = {
                    permissions: data.permissions || [],
                    loading: false,
                    error: null,
                    lastFetched: Date.now(),
                };
            }
        } catch (error) {
            globalCache = {
                permissions: [],
                loading: false,
                error: 'Network error',
                lastFetched: Date.now(),
            };
        }

        setState(globalCache);
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const can = useCallback((permission: string): boolean => {
        return globalCache.permissions.includes(permission);
    }, []);

    const canAny = useCallback((permissions: string[]): boolean => {
        return permissions.some((p) => globalCache.permissions.includes(p));
    }, []);

    const canAll = useCallback((permissions: string[]): boolean => {
        return permissions.every((p) => globalCache.permissions.includes(p));
    }, []);

    const refresh = useCallback(() => {
        fetchPermissions(true);
    }, [fetchPermissions]);

    return {
        permissions: state.permissions,
        loading: state.loading,
        error: state.error,
        can,
        canAny,
        canAll,
        refresh,
    };
}

// Clear client-side cache (call on logout)
export function clearPermissionsCache() {
    globalCache = {
        permissions: [],
        loading: false,
        error: null,
        lastFetched: null,
    };
}
