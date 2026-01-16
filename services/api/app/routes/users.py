"""
User Routes

CRUD endpoints for user management with RBAC and node scoping.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import AuthContext, RequireAuth, hash_password
from app.db.models import User, UserRole
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can, require_permission
from app.scope import enforce_node_filter

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateUserRequest(BaseModel):
    username: str = Field(min_length=3)
    email: EmailStr
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    password: str | None = None
    role: str | None = None
    nodeId: str | None = None
    status: str | None = None


class UpdateUserRequest(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    bio: str | None = None
    timezone: str | None = None
    language: str | None = None
    status: str | None = None


class BulkActionRequest(BaseModel):
    ids: list[str]
    action: str | None = None
    status: str | None = None


class UserListResponse(BaseModel):
    users: list[dict[str, Any]]
    total: int
    page: int
    limit: int
    totalPages: int


# ============= Endpoints =============

@router.get("")
async def list_users(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str = Query("", description="Search by name, email, or username"),
    status: str = Query("", description="Filter by status"),
    role: str = Query("", description="Filter by role"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> UserListResponse:
    """
    List users with pagination and filtering.
    Respects node scoping for non-admin users.
    """
    # Check permission
    if not await can(db, context, "user:read"):
        raise RBACError("user:read")
    
    # Build query
    query = select(User).options(selectinload(User.roles))
    count_query = select(func.count()).select_from(User)
    
    # Apply search filter
    if search:
        search_filter = (
            User.first_name.ilike(f"%{search}%") |
            User.last_name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Apply status filter
    if status and status != "all":
        query = query.where(User.status == status.upper())
        count_query = count_query.where(User.status == status.upper())
    
    # Apply node scope filtering
    query = enforce_node_filter(query, User, "node_id", context)
    count_query = enforce_node_filter(count_query, User, "node_id", context)
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply pagination
    skip = (page - 1) * limit
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Transform for response
    users_data = []
    for user in users:
        role_keys = [ur.role_key.value for ur in user.roles] if user.roles else []
        if not role_keys:
            role_keys = [user.role.value if hasattr(user.role, 'value') else str(user.role)]
        
        users_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "status": user.status.value if hasattr(user.status, 'value') else str(user.status),
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "roles": role_keys,
            "isActive": user.is_active,
            "nodeId": user.node_id,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
        })
    
    return UserListResponse(
        users=users_data,
        total=total,
        page=page,
        limit=limit,
        totalPages=(total + limit - 1) // limit,
    )


@router.post("")
async def create_user(
    request: CreateUserRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Create a new user.
    """
    # Check permission
    if not await can(db, context, "user:create"):
        raise RBACError("user:create")
    
    # Check if email or username exists
    result = await db.execute(
        select(User).where(
            (User.email == request.email.lower()) | (User.username == request.username)
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestError("User with this email or username already exists")
    
    # Hash password or generate temporary
    if request.password:
        password_hash = hash_password(request.password)
    else:
        import secrets
        temp_password = f"Temp{secrets.token_urlsafe(8)}!1"
        password_hash = hash_password(temp_password)
    
    # Security check: only ADMIN can create ADMIN users
    if request.role == "ADMIN" and context.role != "ADMIN":
        raise RBACError("Only administrators can create admin users")
    
    # Create user
    user = User(
        username=request.username,
        email=request.email.lower(),
        first_name=request.firstName,
        last_name=request.lastName,
        password_hash=password_hash,
        role=request.role or "LEARNER",
        node_id=request.nodeId,
        status=request.status or "ACTIVE",
        is_active=True,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "nodeId": user.node_id,
    }


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Get a single user by ID.
    """
    if not await can(db, context, "user:read"):
        raise RBACError("user:read")
    
    result = await db.execute(
        select(User).options(selectinload(User.roles)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User")
    
    # Node scope check
    from app.scope import validate_node_access
    if not validate_node_access(context, user.node_id):
        raise NotFoundError("User")
    
    role_keys = [ur.role_key.value for ur in user.roles] if user.roles else []
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "bio": user.bio,
        "timezone": user.timezone,
        "language": user.language,
        "status": user.status.value if hasattr(user.status, 'value') else str(user.status),
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "roles": role_keys,
        "isActive": user.is_active,
        "isVerified": user.is_verified,
        "nodeId": user.node_id,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
    }


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Update a user.
    """
    if not await can(db, context, "user:update"):
        raise RBACError("user:update")
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User")
    
    # Node scope check
    from app.scope import validate_node_access
    if not validate_node_access(context, user.node_id):
        raise NotFoundError("User")
    
    # Update fields
    if request.firstName is not None:
        user.first_name = request.firstName
    if request.lastName is not None:
        user.last_name = request.lastName
    if request.bio is not None:
        user.bio = request.bio
    if request.timezone is not None:
        user.timezone = request.timezone
    if request.language is not None:
        user.language = request.language
    if request.status is not None:
        user.status = request.status
    
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "status": user.status.value if hasattr(user.status, 'value') else str(user.status),
    }


@router.delete("")
async def bulk_delete_users(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk delete users.
    """
    if not await can(db, context, "user:delete"):
        raise RBACError("user:delete")
    
    if not request.ids:
        raise BadRequestError("No user IDs provided")
    
    # Delete user roles first
    await db.execute(
        UserRole.__table__.delete().where(UserRole.user_id.in_(request.ids))
    )
    
    # Delete users
    result = await db.execute(
        User.__table__.delete().where(User.id.in_(request.ids))
    )
    
    await db.commit()
    
    return {"success": True, "deleted": result.rowcount}


@router.patch("")
async def bulk_update_users(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk update users (activate, deactivate, unlock).
    """
    if not await can(db, context, "user:update"):
        raise RBACError("user:update")
    
    if not request.ids:
        raise BadRequestError("No user IDs provided")
    
    update_data = {}
    
    if request.action == "activate":
        update_data = {"status": "ACTIVE"}
    elif request.action == "deactivate":
        update_data = {"status": "INACTIVE"}
    elif request.action == "unlock":
        update_data = {"status": "ACTIVE", "locked_until": None, "failed_login_attempts": 0}
    elif request.status:
        update_data = {"status": request.status}
    else:
        raise BadRequestError("Invalid action")
    
    result = await db.execute(
        User.__table__.update()
        .where(User.id.in_(request.ids))
        .values(**update_data)
    )
    
    await db.commit()
    
    return {"success": True, "updated": result.rowcount}
