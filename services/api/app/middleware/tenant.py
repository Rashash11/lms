"""
Enhanced Tenant Middleware with Branch Scoping and Correlation IDs

This middleware sets context variables for every request:
1. tenant_id - Extracted from JWT for multi-tenant isolation
2. branch_id (node_id) - Extracted from JWT for branch-level scoping
3. correlation_id - Generated or extracted for request tracing
"""

import uuid
import logging
from contextvars import ContextVar

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth import verify_token_light
from app.db.hooks import tenant_context, branch_context, user_context

logger = logging.getLogger(__name__)

# Correlation ID for request tracing (OpenTelemetry compatible)
correlation_id_context: ContextVar[str] = ContextVar("correlation_id", default="")


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to set tenant, branch, and user context for every request.
    
    This middleware:
    1. Extracts the session cookie
    2. Decodes the JWT (light verification, no DB call)
    3. Sets context variables for use by SQLAlchemy hooks and route handlers
    4. Generates/propagates correlation ID for distributed tracing
    """
    
    async def dispatch(self, request: Request, call_next):
        # 1. Generate or extract correlation ID for tracing
        correlation_id = request.headers.get(
            "X-Correlation-ID", 
            request.headers.get("X-Request-ID", str(uuid.uuid4()))
        )
        correlation_token = correlation_id_context.set(correlation_id)
        
        # 2. Extract tenant/branch/user from JWT in session cookie
        tenant_id = None
        branch_id = None
        user_id = None
        
        session_cookie = request.cookies.get("session")
        
        if session_cookie:
            try:
                payload = verify_token_light(session_cookie)
                tenant_id = payload.get("tenantId")
                branch_id = payload.get("nodeId")
                user_id = payload.get("userId")
            except Exception as e:
                # Invalid token - let the auth layer handle it later
                # We just don't set context variables
                logger.debug(f"Failed to extract context from session cookie: {e}")
        
        # 3. Set context variables
        tenant_token = None
        branch_token = None
        user_token = None
        
        if tenant_id:
            tenant_token = tenant_context.set(tenant_id)
        if branch_id:
            branch_token = branch_context.set(branch_id)
        if user_id:
            user_token = user_context.set(user_id)
        
        # 4. Store in request.state for easy access in route handlers
        request.state.tenant_id = tenant_id
        request.state.branch_id = branch_id
        request.state.user_id = user_id
        request.state.correlation_id = correlation_id
        
        try:
            response = await call_next(request)
            
            # Add correlation ID to response headers for tracing
            response.headers["X-Correlation-ID"] = correlation_id
            
            return response
        finally:
            # Always reset context variables to prevent leaks between requests
            correlation_id_context.reset(correlation_token)
            if tenant_token:
                tenant_context.reset(tenant_token)
            if branch_token:
                branch_context.reset(branch_token)
            if user_token:
                user_context.reset(user_token)


# Export for convenience
__all__ = [
    "TenantMiddleware",
    "correlation_id_context",
]
