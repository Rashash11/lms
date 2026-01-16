"""
JWT Token Handling

Implements HS256 signing and verification with:
- iss = "lms-auth"
- aud = "lms-api"
- exp, iat enforced
- tokenVersion for logout-all revocation
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.errors import AuthError

settings = get_settings()


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    tenant_id: str | None = None,
    node_id: str | None = None,
    token_version: int = 0,
) -> str:
    """
    Create a signed JWT access token.
    
    Args:
        user_id: User's UUID
        email: User's email
        role: User's active role (ADMIN, INSTRUCTOR, LEARNER, etc.)
        node_id: User's node/branch ID (optional for ADMIN)
        token_version: For logout-all invalidation
    
    Returns:
        Signed JWT string
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_minutes)
    
    payload = {
        "userId": user_id,
        "email": email,
        "role": role,
        "tokenVersion": token_version,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }
    
    if tenant_id is not None:
        payload["tenantId"] = tenant_id
    
    if node_id is not None:
        payload["nodeId"] = node_id
    
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    """
    Create a signed JWT refresh token.
    
    Args:
        user_id: User's UUID
    
    Returns:
        Signed JWT string
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.refresh_token_days)
    
    payload = {
        "userId": user_id,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "type": "refresh",
    }
    
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_token_light(token: str) -> dict[str, Any]:
    """
    Lightweight token verification - JWT signature only, no DB check.
    
    Use this in middleware for performance.
    Validates: signature, iss, aud, exp
    Does NOT validate: tokenVersion (requires DB)
    
    Args:
        token: JWT string
    
    Returns:
        Token payload dict
    
    Raises:
        AuthError: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
        return payload
    except JWTError as e:
        raise AuthError("Invalid or expired token") from e


async def verify_token(token: str, db: AsyncSession) -> dict[str, Any]:
    """
    Full token verification including tokenVersion check.
    
    Use this in API routes for security.
    Validates: signature, iss, aud, exp, tokenVersion vs DB
    
    Args:
        token: JWT string
        db: Database session
    
    Returns:
        Token payload dict
    
    Raises:
        AuthError: If token is invalid or revoked
    """
    # First do light verification
    payload = verify_token_light(token)
    
    user_id = payload.get("userId")
    jwt_token_version = payload.get("tokenVersion", 0)
    
    if not user_id:
        raise AuthError("Invalid token: missing userId")
    
    # Check tokenVersion against DB
    from app.db.models import User
    
    result = await db.execute(
        select(User.token_version).where(User.id == user_id)
    )
    row = result.scalar_one_or_none()
    
    if row is None:
        raise AuthError("User not found")
    
    db_token_version = row if row is not None else 0
    
    # Only reject if there's an explicit mismatch
    if jwt_token_version != db_token_version:
        raise AuthError("Token has been revoked")
    
    return payload


def decode_token_unsafe(token: str) -> dict[str, Any] | None:
    """
    Decode token without verification.
    
    Use only for debugging or extracting claims from expired tokens.
    NEVER use this for authentication.
    
    Returns:
        Token payload or None if invalid format
    """
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_signature": False, "verify_exp": False},
        )
    except JWTError:
        return None
