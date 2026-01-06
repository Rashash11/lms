/**
 * Simple in-memory rate limiter for development and single-instance deployments.
 * For scaled production, this should be replaced with Redis.
 */
export class RateLimiter {
    private requests: Map<string, number[]>;
    private cleanupInterval: NodeJS.Timeout;

    constructor(
        private windowMs: number = 60 * 1000,
        private maxRequests: number = 10
    ) {
        this.requests = new Map();
        // Cleanup every 10 minutes to prevent memory leaks
        this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }

    /**
     * Check if a key has exceeded the rate limit
     * Returns true if allowed, false if limit exceeded
     */
    public check(key: string, skip: boolean = false): boolean {
        // Allow bypassing rate limits in non-production environments (e.g. for CI/Smoke tests)
        if ((process.env.NODE_ENV !== 'production' && process.env.SKIP_RATE_LIMIT === '1') || skip) {
            return true;
        }

        const now = Date.now();
        const timestamps = this.requests.get(key) || [];

        // Filter out old timestamps
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

        if (validTimestamps.length >= this.maxRequests) {
            this.requests.set(key, validTimestamps);
            return false;
        }

        validTimestamps.push(now);
        this.requests.set(key, validTimestamps);
        return true;
    }

    /**
     * Get remaining requests for a key
     */
    public getRemaining(key: string): number {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
        return Math.max(0, this.maxRequests - validTimestamps.length);
    }

    /**
     * Get seconds until the oldest request expires (for Retry-After header)
     */
    public getRetryAfter(key: string): number {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

        if (validTimestamps.length < this.maxRequests) return 0;

        // Find the oldest request that is still counting against us
        // The one that, once expired, frees up a slot
        // Since we filtered for valid (< windowMs), the oldest one is at index 0 (assuming sorted push)
        const oldest = validTimestamps[0];
        const resetTime = oldest + this.windowMs;
        return Math.ceil((resetTime - now) / 1000);
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, timestamps] of this.requests.entries()) {
            const valid = timestamps.filter(t => now - t < this.windowMs);
            if (valid.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, valid);
            }
        }
    }

    public destroy() {
        clearInterval(this.cleanupInterval);
    }
}

// Global instances for specific endpoints to preserve state across hot reloads in dev
// Note: In Next.js route handlers, this might reset on cold starts, which is acceptable for simple auth limiting.
export const loginLimiter = new RateLimiter(60 * 1000, 5); // 5 attempts per minute
export const refreshLimiter = new RateLimiter(60 * 1000, 10); // 10 attempts per minute
export const globalLimiter = new RateLimiter(60 * 1000, 100); // General API limit
