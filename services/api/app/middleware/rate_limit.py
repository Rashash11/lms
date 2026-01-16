"""
Redis-Backed Rate Limiting Middleware

Implements sliding window rate limiting with support for:
- Per-tenant limits (prevent noisy neighbor in multi-tenant)
- Per-IP limits (anonymous/unauthenticated protection)
- Per-user limits (authenticated user protection)

Uses Redis sorted sets for efficient sliding window implementation.
Designed to fail-open: if Redis is unavailable, requests are allowed through.
"""

import logging
import time
from dataclasses import dataclass
from typing import Literal, Dict, Optional

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for a rate limit rule."""
    requests: int           # Max requests allowed
    window_seconds: int     # Time window in seconds
    scope: Literal["ip", "user", "tenant"]  # What to rate limit by


# Default rate limits by endpoint pattern
# More specific patterns should come first
DEFAULT_LIMITS: Dict[str, RateLimitConfig] = {
    # Auth endpoints - strict limits to prevent brute force
    "/api/auth/login": RateLimitConfig(5, 60, "ip"),           # 5 per minute per IP
    "/api/auth/register": RateLimitConfig(3, 300, "ip"),       # 3 per 5 min per IP
    "/api/auth/forgot-password": RateLimitConfig(3, 300, "ip"), # 3 per 5 min per IP
    "/api/auth/reset-password": RateLimitConfig(5, 300, "ip"),  # 5 per 5 min per IP
    
    # Import endpoints - heavy operations
    "/api/import": RateLimitConfig(5, 60, "tenant"),           # 5 per minute per tenant
    
    # Report generation - resource intensive
    "/api/reports/generate": RateLimitConfig(10, 60, "user"),  # 10 per minute per user
    
    # General API - reasonable defaults
    "/api/": RateLimitConfig(200, 60, "tenant"),               # 200 per minute per tenant
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Redis-backed sliding window rate limiter.
    
    Uses sorted sets to implement accurate sliding window:
    - Each request timestamp is added to a sorted set
    - Expired timestamps (outside window) are removed
    - Count of remaining timestamps determines if limit exceeded
    
    Fail-open design: if Redis is unavailable, requests pass through.
    """
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self._redis = redis_client
        self._redis_available = redis_client is not None
    
    def set_redis(self, redis_client):
        """Set Redis client after initialization (for late binding)."""
        self._redis = redis_client
        self._redis_available = redis_client is not None
    
    def _get_limit_config(self, path: str) -> Optional[RateLimitConfig]:
        """Get rate limit config for a path (most specific match wins)."""
        # Check exact matches first
        if path in DEFAULT_LIMITS:
            return DEFAULT_LIMITS[path]
        
        # Check prefix matches (longest match wins)
        best_match = None
        best_length = 0
        
        for pattern, config in DEFAULT_LIMITS.items():
            if path.startswith(pattern) and len(pattern) > best_length:
                best_match = config
                best_length = len(pattern)
        
        return best_match
    
    def _get_identifier(self, request: Request, config: RateLimitConfig) -> str:
        """Build identifier based on scope."""
        if config.scope == "ip":
            # Get real IP (handles proxies)
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                return forwarded.split(",")[0].strip()
            return request.client.host if request.client else "unknown"
        
        elif config.scope == "user":
            # Get user ID from request state (set by TenantMiddleware)
            user_id = getattr(request.state, "user_id", None)
            return user_id or "anonymous"
        
        else:  # tenant
            # Get tenant ID from request state
            tenant_id = getattr(request.state, "tenant_id", None)
            return tenant_id or "default"
    
    def _get_key(self, request: Request, config: RateLimitConfig) -> str:
        """Build Redis key for rate limiting."""
        identifier = self._get_identifier(request, config)
        path = request.url.path
        return f"ratelimit:{config.scope}:{identifier}:{path}"
    
    async def _check_rate_limit(self, key: str, config: RateLimitConfig) -> tuple[bool, int]:
        """
        Check if rate limit is exceeded.
        
        Returns:
            (is_limited, current_count)
        """
        if not self._redis or not self._redis_available:
            return False, 0  # Fail open
        
        try:
            now = time.time()
            window_start = now - config.window_seconds
            
            # Use pipeline for atomicity
            async with self._redis.pipeline(transaction=True) as pipe:
                # Remove expired entries
                await pipe.zremrangebyscore(key, 0, window_start)
                # Add current request
                await pipe.zadd(key, {str(now): now})
                # Count requests in window
                await pipe.zcard(key)
                # Set key expiration
                await pipe.expire(key, config.window_seconds)
                
                results = await pipe.execute()
            
            current_count = results[2]
            is_limited = current_count > config.requests
            
            return is_limited, current_count
            
        except Exception as e:
            logger.warning(f"[RateLimit] Redis error, failing open: {e}")
            self._redis_available = False  # Disable until next restart
            return False, 0
    
    async def dispatch(self, request: Request, call_next):
        # Get rate limit config for this path
        config = self._get_limit_config(request.url.path)
        
        if not config:
            # No rate limit for this path
            return await call_next(request)
        
        key = self._get_key(request, config)
        is_limited, current_count = await self._check_rate_limit(key, config)
        
        if is_limited:
            logger.warning(
                f"[RateLimit] Exceeded: {key} ({current_count}/{config.requests})",
                extra={
                    "key": key,
                    "count": current_count,
                    "limit": config.requests,
                    "window": config.window_seconds,
                }
            )
            
            return JSONResponse(
                status_code=429,
                content={
                    "error": "TOO_MANY_REQUESTS",
                    "message": f"Rate limit exceeded. Try again in {config.window_seconds} seconds.",
                    "retryAfter": config.window_seconds,
                },
                headers={
                    "Retry-After": str(config.window_seconds),
                    "X-RateLimit-Limit": str(config.requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + config.window_seconds),
                }
            )
        
        # Add rate limit headers to successful response
        response = await call_next(request)
        
        remaining = max(0, config.requests - current_count)
        response.headers["X-RateLimit-Limit"] = str(config.requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + config.window_seconds)
        
        return response


__all__ = ["RateLimitMiddleware", "RateLimitConfig", "DEFAULT_LIMITS"]
