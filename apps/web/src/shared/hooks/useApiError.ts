'use client';

import { useCallback } from 'react';

type ApiErrorHandler = {
    /** Handle an API response, returns true if there was an error */
    handleResponse: (response: Response) => boolean;
    /** Handle an API response and extract JSON, throws on error */
    handleJsonResponse: <T>(response: Response) => Promise<T>;
};

/**
 * Hook for consistent API error handling
 * 
 * @example
 * ```tsx
 * const { handleResponse, handleJsonResponse } = useApiError();
 * 
 * const response = await fetch('/api/courses');
 * if (handleResponse(response)) return; // Returns true if error was handled
 * 
 * const data = await handleJsonResponse<Course[]>(response);
 * ```
 */
export function useApiError(options?: {
    onUnauthorized?: () => void;
    onForbidden?: (message?: string) => void;
    onNotFound?: () => void;
    onError?: (status: number, message?: string) => void;
}): ApiErrorHandler {
    const redirectToLogin = () => {
        const redirect = typeof window !== 'undefined' ? window.location.pathname : '/';
        window.location.href = '/login?redirect=' + encodeURIComponent(redirect);
    };

    const handleResponse = useCallback((response: Response): boolean => {
        if (response.ok) return false;

        switch (response.status) {
            case 401:
                // Unauthorized - redirect to login
                if (options?.onUnauthorized) {
                    options.onUnauthorized();
                } else {
                    redirectToLogin();
                }
                return true;

            case 403:
                // Forbidden - show access denied
                if (options?.onForbidden) {
                    options.onForbidden();
                }
                return true;

            case 404:
                // Not found
                if (options?.onNotFound) {
                    options.onNotFound();
                }
                return true;

            default:
                if (options?.onError) {
                    options.onError(response.status);
                }
                return true;
        }
    }, [options]);

    const handleJsonResponse = useCallback(async <T,>(response: Response): Promise<T> => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            switch (response.status) {
                case 401:
                    if (options?.onUnauthorized) {
                        options.onUnauthorized();
                    } else {
                        redirectToLogin();
                    }
                    throw new Error('Unauthorized');

                case 403:
                    if (options?.onForbidden) {
                        options.onForbidden(errorData.reason || errorData.error);
                    }
                    throw new Error(errorData.reason || 'Access denied');

                case 404:
                    if (options?.onNotFound) {
                        options.onNotFound();
                    }
                    throw new Error('Not found');

                default:
                    if (options?.onError) {
                        options.onError(response.status, errorData.error);
                    }
                    throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
        }

        return response.json();
    }, [options]);

    return { handleResponse, handleJsonResponse };
}

export default useApiError;
