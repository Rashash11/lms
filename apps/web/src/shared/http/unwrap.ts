export function unwrapArray<T>(payload: unknown, keys: string[] = ['data']): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (!payload || typeof payload !== 'object') return [];
    const anyPayload = payload as Record<string, unknown>;
    for (const key of keys) {
        const value = anyPayload[key];
        if (Array.isArray(value)) return value as T[];
    }
    return [];
}

