"""
Auth Routes

All authentication endpoints matching the TypeScript implementation.
"""

from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    AuthContext,
    RequireAuth,
    create_access_token,
    create_refresh_token,
    hash_password,
    validate_password_policy,
    verify_password,
    verify_token,
)
from app.config import get_settings
from app.db.models import Branch, User
from app.db.session import get_db
from app.errors import AuthError, BadRequestError, NotFoundError
from app.rbac import get_user_permissions

router = APIRouter()
settings = get_settings()


# ============= Request/Response Schemas =============

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    ok: bool = True
    userId: str
    role: str


class SignupRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3)
    password: str = Field(min_length=8)
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)


class MeResponse(BaseModel):
    ok: bool = True
    claims: dict[str, Any]
    user: dict[str, Any]


class SwitchNodeRequest(BaseModel):
    nodeId: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)


# ============= Helper Functions =============

def set_session_cookie(response: Response, token: str) -> None:
    """Set the session cookie on response."""
    response.set_cookie(
        key="session",
        value=token,
        httponly=settings.cookie_httponly,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        path="/",
        max_age=settings.access_token_expire_seconds,
    )


def clear_session_cookie(response: Response) -> None:
    """Clear the session cookie."""
    response.delete_cookie(key="session", path="/")


# ============= Endpoints =============

@router.post("/login")
async def login(
    request: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """
    Login with email and password.
    Sets httpOnly session cookie on success.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == request.email.lower())
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash:
        raise AuthError("Invalid email or password", status_code=401)
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise AuthError("Invalid email or password", status_code=401)
    
    # Check if active
    if not user.is_active:
        raise AuthError("Account is disabled", status_code=403)
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    
    # Get token version
    token_version = user.token_version or 0
    
    # Create access token
    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        tenant_id=user.tenant_id,
        node_id=user.node_id,
        token_version=token_version,
    )
    
    # Set cookie
    set_session_cookie(response, token)
    
    return LoginResponse(
        ok=True,
        userId=user.id,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
    )


@router.post("/logout")
async def logout(
    response: Response,
    context: RequireAuth,
) -> dict[str, Any]:
    """
    Logout current session.
    Clears the session cookie.
    """
    clear_session_cookie(response)
    return {"ok": True, "message": "Logged out successfully"}


@router.post("/logout-all")
async def logout_all(
    response: Response,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Logout all sessions by incrementing tokenVersion.
    This invalidates all existing tokens.
    """
    # Increment token version
    await db.execute(
        text("""
            UPDATE users 
            SET token_version = COALESCE(token_version, 0) + 1 
            WHERE id = :user_id
        """),
        {"user_id": context.user_id},
    )
    await db.commit()
    
    # Clear current session
    clear_session_cookie(response)
    
    return {"ok": True, "message": "All sessions invalidated"}


@router.get("/me")
async def get_me(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MeResponse:
    """
    Get current user info and claims.
    """
    result = await db.execute(
        select(User).where(User.id == context.user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User")
    
    return MeResponse(
        ok=True,
        claims={
            "userId": context.user_id,
            "email": context.email,
            "role": context.role,
            "nodeId": context.node_id,
            "tokenVersion": context.token_version,
        },
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "isActive": user.is_active,
            "isVerified": user.is_verified,
        },
    )


@router.get("/permissions")
async def get_permissions(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Get current user's resolved permissions.
    """
    permissions = await get_user_permissions(db, context.user_id, context.node_id)
    return {"permissions": list(permissions)}


@router.post("/switch-node")
async def switch_node(
    request: SwitchNodeRequest,
    response: Response,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Switch to a different node/branch.
    Validates node exists and user has access.
    """
    node_id = request.nodeId
    
    # Validate node exists
    result = await db.execute(
        select(Branch).where(Branch.id == node_id)
    )
    branch = result.scalar_one_or_none()
    
    if not branch:
        raise NotFoundError("Node")
    
    if not branch.is_active:
        raise AuthError("Node is inactive", status_code=403)
    
    # Authorization check
    if context.role != "ADMIN":
        # Non-admin must be assigned to this node
        result = await db.execute(
            select(User.node_id).where(User.id == context.user_id)
        )
        user_node = result.scalar_one_or_none()
        
        if user_node != node_id:
            raise AuthError("No access to this node", status_code=403)
    
    # Create new token with updated nodeId
    token = create_access_token(
        user_id=context.user_id,
        email=context.email,
        role=context.role,
        node_id=node_id,
        token_version=context.token_version,
    )
    
    set_session_cookie(response, token)
    
    return {"ok": True, "nodeId": node_id}


@router.post("/signup")
async def signup(
    request: SignupRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Register a new user.
    """
    # Validate password policy
    valid, error = validate_password_policy(request.password)
    if not valid:
        raise BadRequestError(error or "Invalid password")
    
    # Check if email or username exists
    result = await db.execute(
        select(User).where(
            (User.email == request.email.lower()) | (User.username == request.username)
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestError("User with this email or username already exists")
    
    # Create user
    password_hash = hash_password(request.password)
    
    user = User(
        email=request.email.lower(),
        username=request.username,
        first_name=request.firstName,
        last_name=request.lastName,
        password_hash=password_hash,
        role="LEARNER",
        is_active=True,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {"ok": True, "userId": user.id}


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Refresh access token.
    """
    # Get current session
    token = request.cookies.get("session")
    if not token:
        raise AuthError("No session to refresh", status_code=401)
    
    try:
        payload = await verify_token(token, db)
    except AuthError:
        raise AuthError("Invalid or expired session", status_code=401)
    
    # Get fresh user data
    result = await db.execute(
        select(User).where(User.id == payload.get("userId"))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise AuthError("User not found", status_code=401)
    
    if not user.is_active:
        raise AuthError("Account is disabled", status_code=403)
    
    # Create new token
    new_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        tenant_id=user.tenant_id,
        node_id=user.node_id,
        token_version=user.token_version or 0,
    )
    
    set_session_cookie(response, new_token)
    
    return {"ok": True, "refreshed": True}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Request password reset email.
    Always returns success to prevent email enumeration.
    """
    # In production, would send email with reset token
    # For now, just return success
    return {"ok": True, "message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Reset password using reset token.
    """
    # Validate password policy
    valid, error = validate_password_policy(request.password)
    if not valid:
        raise BadRequestError(error or "Invalid password")
    
    # In production, would validate token and update password
    # For now, return error (token not implemented)
    raise BadRequestError("Password reset not implemented yet")
