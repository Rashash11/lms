'use client';

import { useState, useEffect, useCallback } from 'react';

interface PermissionsState {
    permissions: string[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const CACHE_TTL = 300000;
const STORAGE_KEY = 'lms.permissions.cache.v1';

let globalCache: PermissionsState = {
    permissions: [],
    loading: false,
    error: null,
    lastFetched: null,
};

export function usePermissions() {
    const [state, setState] = useState<PermissionsState>(globalCache);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { permissions?: unknown; lastFetched?: unknown };
            if (!Array.isArray(parsed.permissions)) return;
            if (typeof parsed.lastFetched !== 'number') return;
            if (Date.now() - parsed.lastFetched >= CACHE_TTL) return;

            globalCache = {
                permissions: parsed.permissions.filter((p): p is string => typeof p === 'string'),
                loading: false,
                error: null,
                lastFetched: parsed.lastFetched,
            };
            setState(globalCache);
        } catch {
            return;
        }
    }, []);

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
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify({ permissions: globalCache.permissions, lastFetched: globalCache.lastFetched })
                    );
                }
            }
        } catch (error) {
            globalCache = {
                permissions: [],
                loading: false,
                error: 'Network error',
                lastFetched: Date.now(),
            };
        }

        if (globalCache.error === 'Not authenticated' && typeof window !== 'undefined') {
            window.localStorage.removeItem(STORAGE_KEY);
        }

        setState(globalCache);
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const can = useCallback((permission: string): boolean => {
        return state.permissions.includes(permission);
    }, [state.permissions]);

    const canAny = useCallback((permissions: string[]): boolean => {
        return permissions.some((p) => state.permissions.includes(p));
    }, [state.permissions]);

    const canAll = useCallback((permissions: string[]): boolean => {
        return permissions.every((p) => state.permissions.includes(p));
    }, [state.permissions]);

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
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
    }
}
