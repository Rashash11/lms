import { z } from 'zod';

export * from '../shared/validations';

export class ValidationError extends Error {
    public errors?: unknown;

    constructor(message: string, errors?: unknown) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

export async function validateBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        throw new ValidationError('Invalid request body');
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError('Validation failed', result.error.flatten());
    }
    return result.data;
}

export function validateQuery<T extends z.ZodTypeAny>(searchParams: URLSearchParams, schema: T): z.infer<T> {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of searchParams.entries()) {
        const existing = obj[key];
        if (existing === undefined) obj[key] = value;
        else if (Array.isArray(existing)) (existing as unknown[]).push(value);
        else obj[key] = [existing, value];
    }

    const result = schema.safeParse(obj);
    if (!result.success) {
        throw new ValidationError('Invalid query parameters', result.error.flatten());
    }
    return result.data;
}

