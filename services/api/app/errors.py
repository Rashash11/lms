"""
JSON-only Exception Handlers

Ensures ALL responses (including 404, 405, 422, 500) are JSON format.
No HTML ever returned.
"""

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    """Base application error."""
    
    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        reason: str | None = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.reason = reason
        super().__init__(message)


class AuthError(AppError):
    """Authentication/authorization error."""
    
    def __init__(self, message: str = "Authentication required", status_code: int = 401):
        super().__init__(
            message=message,
            error_code="UNAUTHORIZED" if status_code == 401 else "FORBIDDEN",
            status_code=status_code,
        )


class RBACError(AppError):
    """RBAC permission denied error."""
    
    def __init__(self, permission: str):
        super().__init__(
            message=f"Missing permission: {permission}",
            error_code="FORBIDDEN",
            status_code=403,
            reason=f"Permission required: {permission}",
        )


class NodeScopeError(AppError):
    """Node scoping violation error."""
    
    def __init__(self, message: str = "Node scope required for this operation"):
        super().__init__(
            message=message,
            error_code="FORBIDDEN",
            status_code=403,
        )


class NotFoundError(AppError):
    """Resource not found error."""
    
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            message=f"{resource} not found",
            error_code="NOT_FOUND",
            status_code=404,
        )


class BadRequestError(AppError):
    """Invalid request error."""
    
    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="BAD_REQUEST",
            status_code=400,
        )


def _error_response(
    status_code: int,
    error_code: str,
    message: str,
    reason: str | None = None,
    details: Any = None,
) -> JSONResponse:
    """Create standardized JSON error response."""
    content: dict[str, Any] = {
        "error": error_code,
        "message": message,
    }
    if reason:
        content["reason"] = reason
    if details:
        content["details"] = details
    
    return JSONResponse(status_code=status_code, content=content)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Handle application-specific errors."""
    return _error_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        reason=exc.reason,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions (404, 405, etc.) as JSON."""
    error_codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_ERROR",
    }
    
    error_code = error_codes.get(exc.status_code, "ERROR")
    message = str(exc.detail) if exc.detail else f"HTTP {exc.status_code}"
    
    return _error_response(
        status_code=exc.status_code,
        error_code=error_code,
        message=message,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors as JSON."""
    errors = exc.errors()
    
    # Extract first error message for main message
    first_error = errors[0] if errors else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", ["unknown"]))
    msg = first_error.get("msg", "Validation error")
    
    return _error_response(
        status_code=422,
        error_code="VALIDATION_ERROR",
        message=f"{field}: {msg}",
        details=errors,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle any unhandled exception as JSON 500."""
    # Log the error in production
    import logging
    logging.exception("Unhandled exception: %s", exc)
    
    return _error_response(
        status_code=500,
        error_code="INTERNAL_ERROR",
        message="An unexpected error occurred",
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI app."""
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
