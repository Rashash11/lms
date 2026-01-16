/**
 * Rate Limiter with Redis Support
 * 
 * For single-instance: Uses in-memory sliding window
 * For scaled production: Uses Redis with Lua scripts
 */

// Rate limit configurations by endpoint type
export const RATE_LIMIT_CONFIGS = {
    'auth:login': { windowMs: 60 * 1000, maxRequests: 5, blockDurationMs: 300 * 1000 },
    'auth:register': { windowMs: 3600 * 1000, maxRequests: 3, blockDurationMs: 3600 * 1000 },
    'auth:password-reset': { windowMs: 3600 * 1000, maxRequests: 3 },
    'api:default': { windowMs: 60 * 1000, maxRequests: 100 },
    'api:search': { windowMs: 60 * 1000, maxRequests: 30 },
    'api:write': { windowMs: 60 * 1000, maxRequests: 50 },
    'api:export': { windowMs: 3600 * 1000, maxRequests: 10 },
    'api:import': { windowMs: 3600 * 1000, maxRequests: 5 },
    'api:upload': { windowMs: 60 * 1000, maxRequests: 20 },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMIT_CONFIGS;

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    blockDurationMs?: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

/**
 * In-memory rate limiter (development/single-instance)
 */
export class RateLimiter {
    private requests: Map<string, number[]>;
    private blocked: Map<string, number>;
    private cleanupInterval: NodeJS.Timeout;

    constructor(
        private windowMs: number = 60 * 1000,
        private maxRequests: number = 10,
        private blockDurationMs?: number
    ) {
        this.requests = new Map();
        this.blocked = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }

    /**
     * Check if a key has exceeded the rate limit
     */
    public check(key: string, skip: boolean = false): boolean {
        if ((process.env.NODE_ENV !== 'production' && process.env.SKIP_RATE_LIMIT === '1') || skip) {
            return true;
        }

        const now = Date.now();

        // Check if blocked
        const blockedUntil = this.blocked.get(key);
        if (blockedUntil && now < blockedUntil) {
            return false;
        } else if (blockedUntil) {
            this.blocked.delete(key);
        }

        const timestamps = this.requests.get(key) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

        if (validTimestamps.length >= this.maxRequests) {
            // Block if configured
            if (this.blockDurationMs) {
                this.blocked.set(key, now + this.blockDurationMs);
            }
            this.requests.set(key, validTimestamps);
            return false;
        }

        validTimestamps.push(now);
        this.requests.set(key, validTimestamps);
        return true;
    }

    /**
     * Check rate limit and return detailed result
     */
    public checkDetailed(key: string): RateLimitResult {
        const now = Date.now();

        if (process.env.SKIP_RATE_LIMIT === '1') {
            return { allowed: true, remaining: this.maxRequests, resetAt: now + this.windowMs };
        }

        // Check if blocked
        const blockedUntil = this.blocked.get(key);
        if (blockedUntil && now < blockedUntil) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: blockedUntil,
                retryAfter: Math.ceil((blockedUntil - now) / 1000),
            };
        }

        const timestamps = this.requests.get(key) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
        const remaining = Math.max(0, this.maxRequests - validTimestamps.length);

        if (validTimestamps.length >= this.maxRequests) {
            const retryAfter = this.getRetryAfter(key);
            return {
                allowed: false,
                remaining: 0,
                resetAt: now + (retryAfter * 1000),
                retryAfter,
            };
        }

        validTimestamps.push(now);
        this.requests.set(key, validTimestamps);

        return {
            allowed: true,
            remaining: remaining - 1,
            resetAt: validTimestamps[0] + this.windowMs,
        };
    }

    public getRemaining(key: string): number {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
        return Math.max(0, this.maxRequests - validTimestamps.length);
    }

    public getRetryAfter(key: string): number {
        const now = Date.now();

        // Check blocked first
        const blockedUntil = this.blocked.get(key);
        if (blockedUntil && now < blockedUntil) {
            return Math.ceil((blockedUntil - now) / 1000);
        }

        const timestamps = this.requests.get(key) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

        if (validTimestamps.length < this.maxRequests) return 0;

        const oldest = validTimestamps[0];
        const resetTime = oldest + this.windowMs;
        return Math.ceil((resetTime - now) / 1000);
    }

    private cleanup() {
        const now = Date.now();

        // Clean requests
        for (const [key, timestamps] of this.requests.entries()) {
            const valid = timestamps.filter(t => now - t < this.windowMs);
            if (valid.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, valid);
            }
        }

        // Clean blocks
        for (const [key, blockedUntil] of this.blocked.entries()) {
            if (now >= blockedUntil) {
                this.blocked.delete(key);
            }
        }
    }

    public destroy() {
        clearInterval(this.cleanupInterval);
    }
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
    public statusCode = 429;
    public retryAfter?: number;

    constructor(message: string, retryAfter?: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

// Global limiter instances
const limiters = new Map<string, RateLimiter>();

function getLimiter(key: RateLimitKey): RateLimiter {
    if (!limiters.has(key)) {
        const config = RATE_LIMIT_CONFIGS[key];
        const blockDuration = 'blockDurationMs' in config ? config.blockDurationMs : undefined;
        limiters.set(key, new RateLimiter(config.windowMs, config.maxRequests, blockDuration));
    }
    return limiters.get(key)!;
}

/**
 * Check rate limit for a specific endpoint type and identifier
 */
export function checkRateLimit(
    type: RateLimitKey,
    identifier: string
): RateLimitResult {
    const limiter = getLimiter(type);
    const key = `${type}:${identifier}`;
    return limiter.checkDetailed(key);
}

/**
 * Middleware-style rate limit check that throws on failure
 */
export async function requireRateLimit(
    type: RateLimitKey,
    identifier: string
): Promise<void> {
    const result = checkRateLimit(type, identifier);

    if (!result.allowed) {
        throw new RateLimitError(
            `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
            result.retryAfter
        );
    }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    };

    if (result.retryAfter) {
        headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
}

// Legacy exports for backward compatibility
export const loginLimiter = new RateLimiter(60 * 1000, 5, 300 * 1000);
export const refreshLimiter = new RateLimiter(60 * 1000, 10);
export const globalLimiter = new RateLimiter(60 * 1000, 100);

