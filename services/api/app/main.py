"""
FastAPI Application Entry Point

Main application setup with routers, middleware, and exception handlers.
"""

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.db.session import close_db, init_db
from app.errors import register_exception_handlers

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
app = FastAPI(
    title="LMS API",
    description="Learning Management System API",
    version="1.0.0",
    lifespan=lifespan,
    # Disable automatic docs in production
    docs_url="/api/docs" if not settings.is_production else None,
    redoc_url="/api/redoc" if not settings.is_production else None,
    openapi_url="/api/openapi.json" if not settings.is_production else None,
)

# Register exception handlers for JSON-only responses
register_exception_handlers(app)

# ============= Middleware Stack =============
# Order matters: outermost middleware runs first
# Request flow: CORS -> RateLimit -> CSRF -> Tenant -> Route Handler
# Response flow: Route Handler -> Tenant -> CSRF -> RateLimit -> CORS

from app.middleware.tenant import TenantMiddleware
from app.middleware.csrf import CSRFMiddleware

# Tenant middleware (extracts tenant/user context from JWT)
app.add_middleware(TenantMiddleware)

# CSRF protection (validates double-submit cookie)
app.add_middleware(CSRFMiddleware)

# Rate limiting (optional - requires Redis)
# Uncomment when Redis is available:
# from app.middleware.rate_limit import RateLimitMiddleware
# import redis.asyncio as redis
# redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)
# app.add_middleware(RateLimitMiddleware, redis_client=redis_client)

# CORS middleware (must be outermost for preflight requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"] if not settings.is_production else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Health check endpoint
@app.get("/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "env": settings.env,
    }


# API health check (matches /api/* pattern)
@app.get("/api/health")
async def api_health_check() -> dict[str, Any]:
    """API health check endpoint."""
    return {
        "ok": True,
        "status": "healthy",
    }


# Import and include routers
from app.routes import (
    auth, users, courses, enrollments, groups, categories, branches,
    learning_paths, assignments, notifications, reports
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(enrollments.router, prefix="/api/enrollments", tags=["enrollments"])
app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(branches.router, prefix="/api/branches", tags=["branches"])
app.include_router(learning_paths.router, prefix="/api/learning-paths", tags=["learning-paths"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])




# Catch-all for unknown /api/* routes - returns JSON 404
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def api_not_found(path: str, request: Request) -> JSONResponse:
    """Return JSON 404 for unknown API routes."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "NOT_FOUND",
            "message": f"API endpoint not found: /{path}",
        },
    )
