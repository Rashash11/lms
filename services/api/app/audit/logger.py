"""
Fail-Open Audit Logger

Provides enterprise-grade audit logging with:
- JSONB snapshots of before/after state
- Severity classification
- Non-blocking writes (fire-and-forget)
- OpenTelemetry-compatible correlation IDs
- Fail-open design (never crashes the main request)

This mirrors the Node.js audit-logger.ts implementation.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import text

from app.db.session import async_session_factory

logger = logging.getLogger(__name__)


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AuditEventType(str, Enum):
    """
    Comprehensive audit event types.
    Matches the TypeScript AuditEventType in audit-logger.ts.
    """
    # Authentication
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAIL = "LOGIN_FAIL"
    LOGOUT = "LOGOUT"
    LOGOUT_ALL = "LOGOUT_ALL"
    TOKEN_REFRESH = "TOKEN_REFRESH"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST"
    PASSWORD_RESET_COMPLETE = "PASSWORD_RESET_COMPLETE"
    MFA_ENABLED = "MFA_ENABLED"
    MFA_DISABLED = "MFA_DISABLED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED"
    
    # Session
    NODE_SWITCH = "NODE_SWITCH"
    IMPERSONATION_START = "IMPERSONATION_START"
    IMPERSONATION_END = "IMPERSONATION_END"
    
    # User Management
    USER_CREATE = "USER_CREATE"
    USER_UPDATE = "USER_UPDATE"
    USER_DELETE = "USER_DELETE"
    USER_ACTIVATE = "USER_ACTIVATE"
    USER_DEACTIVATE = "USER_DEACTIVATE"
    USER_IMPORT = "USER_IMPORT"
    
    # Role & Permission
    ROLE_ASSIGN = "ROLE_ASSIGN"
    ROLE_REMOVE = "ROLE_REMOVE"
    PERMISSION_GRANT = "PERMISSION_GRANT"
    PERMISSION_REVOKE = "PERMISSION_REVOKE"
    
    # Course Management
    COURSE_CREATE = "COURSE_CREATE"
    COURSE_UPDATE = "COURSE_UPDATE"
    COURSE_DELETE = "COURSE_DELETE"
    COURSE_PUBLISH = "COURSE_PUBLISH"
    COURSE_UNPUBLISH = "COURSE_UNPUBLISH"
    
    # Enrollment
    ENROLLMENT_CREATE = "ENROLLMENT_CREATE"
    ENROLLMENT_DELETE = "ENROLLMENT_DELETE"
    ENROLLMENT_COMPLETE = "ENROLLMENT_COMPLETE"
    
    # Assessment
    TEST_SUBMIT = "TEST_SUBMIT"
    TEST_GRADE = "TEST_GRADE"
    ASSIGNMENT_SUBMIT = "ASSIGNMENT_SUBMIT"
    ASSIGNMENT_GRADE = "ASSIGNMENT_GRADE"
    
    # Certificate
    CERTIFICATE_ISSUE = "CERTIFICATE_ISSUE"
    CERTIFICATE_REVOKE = "CERTIFICATE_REVOKE"
    
    # Data Operations
    DATA_EXPORT = "DATA_EXPORT"
    DATA_IMPORT = "DATA_IMPORT"
    REPORT_GENERATE = "REPORT_GENERATE"
    
    # Settings
    SETTINGS_UPDATE = "SETTINGS_UPDATE"
    FEATURE_FLAG_CHANGE = "FEATURE_FLAG_CHANGE"
    
    # Security
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    CSRF_VIOLATION = "CSRF_VIOLATION"
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"


# Severity mapping for auto-classification
SEVERITY_MAP = {
    # Critical events (security sensitive)
    AuditEventType.LOGIN_FAIL: AuditSeverity.CRITICAL,
    AuditEventType.ACCOUNT_LOCKED: AuditSeverity.CRITICAL,
    AuditEventType.IMPERSONATION_START: AuditSeverity.CRITICAL,
    AuditEventType.IMPERSONATION_END: AuditSeverity.CRITICAL,
    AuditEventType.PERMISSION_GRANT: AuditSeverity.CRITICAL,
    AuditEventType.PERMISSION_REVOKE: AuditSeverity.CRITICAL,
    AuditEventType.ROLE_ASSIGN: AuditSeverity.CRITICAL,
    AuditEventType.ROLE_REMOVE: AuditSeverity.CRITICAL,
    AuditEventType.DATA_EXPORT: AuditSeverity.CRITICAL,
    AuditEventType.DATA_IMPORT: AuditSeverity.CRITICAL,
    AuditEventType.RATE_LIMIT_EXCEEDED: AuditSeverity.CRITICAL,
    AuditEventType.CSRF_VIOLATION: AuditSeverity.CRITICAL,
    AuditEventType.UNAUTHORIZED_ACCESS: AuditSeverity.CRITICAL,
    AuditEventType.USER_DELETE: AuditSeverity.CRITICAL,
    
    # High events (important changes)
    AuditEventType.LOGOUT_ALL: AuditSeverity.HIGH,
    AuditEventType.PASSWORD_CHANGE: AuditSeverity.HIGH,
    AuditEventType.PASSWORD_RESET_COMPLETE: AuditSeverity.HIGH,
    AuditEventType.MFA_ENABLED: AuditSeverity.HIGH,
    AuditEventType.MFA_DISABLED: AuditSeverity.HIGH,
    AuditEventType.USER_CREATE: AuditSeverity.HIGH,
    AuditEventType.COURSE_DELETE: AuditSeverity.HIGH,
    AuditEventType.CERTIFICATE_REVOKE: AuditSeverity.HIGH,
    AuditEventType.SETTINGS_UPDATE: AuditSeverity.HIGH,
    AuditEventType.FEATURE_FLAG_CHANGE: AuditSeverity.HIGH,
    
    # Medium events (notable actions)
    AuditEventType.LOGIN_SUCCESS: AuditSeverity.MEDIUM,
    AuditEventType.NODE_SWITCH: AuditSeverity.MEDIUM,
    AuditEventType.USER_UPDATE: AuditSeverity.MEDIUM,
    AuditEventType.COURSE_CREATE: AuditSeverity.MEDIUM,
    AuditEventType.COURSE_PUBLISH: AuditSeverity.MEDIUM,
    AuditEventType.ENROLLMENT_DELETE: AuditSeverity.MEDIUM,
    AuditEventType.CERTIFICATE_ISSUE: AuditSeverity.MEDIUM,
}


@dataclass
class AuditEntry:
    """
    Structured audit log entry.
    
    Contains all the context needed for compliance and debugging.
    """
    event_type: AuditEventType
    tenant_id: Optional[str] = None
    user_id: Optional[str] = None  # Who performed the action
    target_user_id: Optional[str] = None  # Who was affected (if different)
    resource_type: Optional[str] = None  # e.g., "Course", "User"
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    correlation_id: Optional[str] = None  # For distributed tracing
    metadata: dict[str, Any] = field(default_factory=dict)
    before_state: Optional[dict[str, Any]] = None  # State before change
    after_state: Optional[dict[str, Any]] = None   # State after change
    _severity: Optional[AuditSeverity] = None
    
    @property
    def severity(self) -> AuditSeverity:
        """Get severity (explicit or auto-classified)."""
        if self._severity:
            return self._severity
        return SEVERITY_MAP.get(self.event_type, AuditSeverity.LOW)
    
    @severity.setter
    def severity(self, value: AuditSeverity):
        self._severity = value
    
    def to_metadata_json(self) -> str:
        """Serialize all metadata to JSON string for storage."""
        data = {
            "severity": self.severity.value,
            "correlationId": self.correlation_id,
            **self.metadata,
        }
        
        if self.resource_type:
            data["resourceType"] = self.resource_type
        if self.resource_id:
            data["resourceId"] = self.resource_id
        if self.target_user_id:
            data["targetUserId"] = self.target_user_id
        if self.before_state:
            data["before"] = self.before_state
        if self.after_state:
            data["after"] = self.after_state
        
        return json.dumps(data, default=str)


async def log_audit(entry: AuditEntry) -> bool:
    """
    Log an audit event to the database.
    
    This function is designed to be FAIL-OPEN:
    - Never raises exceptions
    - Returns True on success, False on failure
    - Logs errors but doesn't propagate them
    
    Args:
        entry: The audit entry to log
    
    Returns:
        True if logged successfully, False otherwise
    """
    try:
        async with async_session_factory() as session:
            await session.execute(
                text("""
                    INSERT INTO auth_audit_log (
                        id, tenant_id, event_type, user_id,
                        ip_address, user_agent, metadata, created_at
                    ) VALUES (
                        :id, :tenant_id, :event_type, :user_id,
                        :ip_address, :user_agent, :metadata::jsonb, :created_at
                    )
                """),
                {
                    "id": str(uuid4()),
                    "tenant_id": entry.tenant_id,
                    "event_type": entry.event_type.value,
                    "user_id": entry.user_id,
                    "ip_address": entry.ip_address,
                    "user_agent": entry.user_agent,
                    "metadata": entry.to_metadata_json(),
                    "created_at": datetime.now(timezone.utc),
                }
            )
            await session.commit()
            return True
            
    except Exception as e:
        # Fail-open: log error but don't crash
        logger.warning(
            f"[AUDIT] Failed to log event {entry.event_type.value}: {e}",
            extra={
                "event_type": entry.event_type.value,
                "user_id": entry.user_id,
                "error": str(e),
            }
        )
        return False


def log_audit_background(entry: AuditEntry) -> None:
    """
    Fire-and-forget audit logging.
    
    Creates a background task to log the audit entry without blocking
    the main request. This is the recommended way to log during
    API request handling.
    
    Args:
        entry: The audit entry to log
    """
    try:
        # Get the current event loop and create task
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(log_audit(entry))
        else:
            # Fallback for non-async contexts
            loop.run_until_complete(log_audit(entry))
    except RuntimeError:
        # No event loop - try to run synchronously
        try:
            asyncio.run(log_audit(entry))
        except Exception as e:
            logger.warning(f"[AUDIT] Background log failed: {e}")


# ============= Helper Functions =============

def extract_client_ip(request) -> str:
    """
    Extract real client IP from request headers.
    Handles proxies (X-Forwarded-For, X-Real-IP, CF-Connecting-IP).
    """
    # Check common proxy headers
    headers = getattr(request, 'headers', {})
    
    forwarded = headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    cf_ip = headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip
    
    # Fall back to direct client
    client = getattr(request, 'client', None)
    if client and hasattr(client, 'host'):
        return client.host
    
    return "unknown"


def extract_user_agent(request) -> str:
    """Extract user agent from request headers."""
    headers = getattr(request, 'headers', {})
    return headers.get("user-agent", "unknown")


def create_audit_entry_from_request(
    request,
    event_type: AuditEventType,
    **kwargs
) -> AuditEntry:
    """
    Create an AuditEntry with request context auto-filled.
    
    Args:
        request: FastAPI Request object
        event_type: Type of audit event
        **kwargs: Additional fields for AuditEntry
    
    Returns:
        Populated AuditEntry
    """
    # Extract context from request.state (set by TenantMiddleware)
    tenant_id = getattr(request.state, 'tenant_id', None)
    user_id = getattr(request.state, 'user_id', None)
    correlation_id = getattr(request.state, 'correlation_id', None)
    
    return AuditEntry(
        event_type=event_type,
        tenant_id=kwargs.pop('tenant_id', tenant_id),
        user_id=kwargs.pop('user_id', user_id),
        ip_address=kwargs.pop('ip_address', extract_client_ip(request)),
        user_agent=kwargs.pop('user_agent', extract_user_agent(request)),
        correlation_id=kwargs.pop('correlation_id', correlation_id),
        **kwargs
    )


__all__ = [
    "AuditEntry",
    "AuditEventType",
    "AuditSeverity",
    "log_audit",
    "log_audit_background",
    "extract_client_ip",
    "extract_user_agent",
    "create_audit_entry_from_request",
]
