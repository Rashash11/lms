// src/lib/validation-middleware.ts
// Middleware utilities to integrate Zod validation into Next.js App Router API routes.
// These helpers wrap the existing validateBody and validateQuery functions from validations.ts
// and provide a convenient way to enforce validation before entering the route handler.

import { NextRequest } from 'next/server';
import { validateBody, validateQuery, ValidationError } from './validations';
import { z } from 'zod';

/**
 * Validate the request JSON body against a Zod schema.
 * Throws a ValidationError which can be caught by the API guard to return a 400 response.
 */
export async function validateRequestBody<T extends z.ZodSchema>(
    request: NextRequest,
    schema: T
): Promise<z.infer<T>> {
    try {
        // Convert NextRequest to a standard Request for compatibility
        const req = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        });
        return await validateBody(req, schema);
    } catch (err) {
        if (err instanceof ValidationError) {
            // Re‑throw to be handled by the API guard
            throw err;
        }
        // Unexpected error – wrap as validation error for safety
        throw new ValidationError('Invalid request body');
    }
}

/**
 * Validate the request query parameters against a Zod schema.
 */
export function validateRequestQuery<T extends z.ZodSchema>(
    request: NextRequest,
    schema: T
): z.infer<T> {
    try {
        const searchParams = request.nextUrl.searchParams;
        return validateQuery(searchParams, schema);
    } catch (err) {
        if (err instanceof ValidationError) {
            throw err;
        }
        throw new ValidationError('Invalid query parameters');
    }
}

/**
 * Helper to be used inside a withGuard handler to perform validation.
 * Example usage:
 *   const data = await validateRequestBody(request, userSchemas.create);
 */
