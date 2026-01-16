"""
CSRF Protection Middleware

Implements the Double-Submit Cookie Pattern for CSRF protection.

How it works:
1. Frontend sets a CSRF token as a cookie
2. Frontend includes the same token in X-CSRF-Token header for mutations
3. This middleware validates that cookie and header match

This matches the Node.js implementation in api-guard.ts.
"""

import logging
from typing import Set

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection via Double-Submit Cookie Pattern.
    
    For state-changing requests (POST, PUT, PATCH, DELETE):
    - Checks that X-CSRF-Token header matches csrf-token cookie
    - Returns 403 if they don't match (when cookie is present)
    """
    
    # HTTP methods that require CSRF validation
    UNSAFE_METHODS: Set[str] = {"POST", "PUT", "PATCH", "DELETE"}
    
    # Paths exempt from CSRF checking (login, refresh, health checks)
    EXEMPT_PATHS: Set[str] = {
        "/api/auth/login",
        "/api/auth/register", 
        "/api/auth/refresh",
        "/api/auth/forgot-password",
        "/api/health",
        "/api/docs",
        "/api/openapi.json",
    }
    
    # Path prefixes to exclude (webhooks, external callbacks)
    EXEMPT_PREFIXES: tuple[str, ...] = (
        "/api/webhooks/",
        "/api/callbacks/",
    )
    
    async def dispatch(self, request: Request, call_next):
        # Skip safe methods (GET, HEAD, OPTIONS)
        if request.method not in self.UNSAFE_METHODS:
            return await call_next(request)
        
        # Skip exempt paths
        path = request.url.path
        if path in self.EXEMPT_PATHS:
            return await call_next(request)
        
        # Skip exempt prefixes
        if path.startswith(self.EXEMPT_PREFIXES):
            return await call_next(request)
        
        # Get CSRF token from cookie and header
        csrf_cookie = request.cookies.get("csrf-token")
        csrf_header = request.headers.get("X-CSRF-Token")
        
        # Only enforce if cookie is present
        # This allows non-browser clients (API keys, etc.) to work without CSRF
        # But browser clients MUST have matching tokens
        if csrf_cookie:
            if not csrf_header:
                logger.warning(
                    f"[CSRF] Missing header for {request.method} {path}",
                    extra={"path": path, "method": request.method}
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "FORBIDDEN",
                        "message": "CSRF token header required"
                    }
                )
            
            if csrf_header != csrf_cookie:
                logger.warning(
                    f"[CSRF] Token mismatch for {request.method} {path}",
                    extra={
                        "path": path,
                        "method": request.method,
                        "cookie_preview": csrf_cookie[:8] + "..." if csrf_cookie else None,
                        "header_preview": csrf_header[:8] + "..." if csrf_header else None,
                    }
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "FORBIDDEN", 
                        "message": "CSRF token mismatch"
                    }
                )
        
        return await call_next(request)


__all__ = ["CSRFMiddleware"]
