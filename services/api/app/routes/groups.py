"""
Group Routes

CRUD endpoints for user groups.
"""

from typing import Annotated, Any, Optional
import secrets

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, RequireAuth
from app.db.models import Group
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can
from app.audit import log_audit_background, AuditEntry, AuditEventType

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateGroupRequest(BaseModel):
    name: str = Field(min_length=1)
    description: Optional[str] = None
    price: Optional[float] = None
    groupKey: Optional[str] = None
    generateKey: Optional[bool] = False
    autoEnroll: Optional[bool] = False
    maxMembers: Optional[int] = None
    branchId: Optional[str] = None


class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    groupKey: Optional[str] = None
    autoEnroll: Optional[bool] = None
    maxMembers: Optional[int] = None


class BulkDeleteRequest(BaseModel):
    ids: list[str]


# ============= Endpoints =============

@router.get("")
async def list_groups(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None, description="Search by name"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """
    GET /api/groups
    List all groups with member/course counts.
    """
    if not await can(db, context, "groups:read"):
        raise RBACError("groups:read")
    
    skip = (page - 1) * limit
    
    # Build query
    query = select(Group)
    count_query = select(func.count()).select_from(Group)
    
    # Apply search filter
    if search:
        query = query.where(Group.name.ilike(f"%{search}%"))
        count_query = count_query.where(Group.name.ilike(f"%{search}%"))
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(Group.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    groups = result.scalars().all()
    
    # Transform for response (member/course counts would need additional queries)
    groups_data = []
    for group in groups:
        groups_data.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "branchId": group.branch_id,
            "instructorId": group.instructor_id,
            "createdAt": group.created_at.isoformat() if group.created_at else None,
            "updatedAt": group.updated_at.isoformat() if group.updated_at else None,
            # TODO: Add member/course counts with separate queries or relationships
            "memberCount": 0,
            "courseCount": 0,
        })
    
    return {
        "data": groups_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


@router.post("")
async def create_group(
    request: CreateGroupRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/groups
    Create a new group.
    """
    if not await can(db, context, "groups:create"):
        raise RBACError("groups:create")
    
    # Generate unique key if requested
    group_key = request.groupKey
    if request.generateKey and not group_key:
        group_key = secrets.token_hex(4).upper()
    
    # Create group
    group = Group(
        name=request.name,
        description=request.description,
        branch_id=request.branchId,
    )
    
    db.add(group)
    await db.commit()
    await db.refresh(group)
    
    # Log audit event
    log_audit_background(AuditEntry(
        event_type=AuditEventType.USER_CREATE,  # Using USER_CREATE as placeholder
        tenant_id=context.tenant_id,
        user_id=context.user_id,
        resource_type="Group",
        resource_id=group.id,
        after_state={"name": group.name},
    ))
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "branchId": group.branch_id,
        "createdAt": group.created_at.isoformat() if group.created_at else None,
    }


@router.get("/{group_id}")
async def get_group(
    group_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/groups/{group_id}
    Get a single group by ID.
    """
    if not await can(db, context, "groups:read"):
        raise RBACError("groups:read")
    
    result = await db.execute(
        select(Group).where(Group.id == group_id)
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise NotFoundError("Group")
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "branchId": group.branch_id,
        "instructorId": group.instructor_id,
        "createdAt": group.created_at.isoformat() if group.created_at else None,
        "updatedAt": group.updated_at.isoformat() if group.updated_at else None,
    }


@router.put("/{group_id}")
async def update_group(
    group_id: str,
    request: UpdateGroupRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PUT /api/groups/{group_id}
    Update a group.
    """
    if not await can(db, context, "groups:update"):
        raise RBACError("groups:update")
    
    result = await db.execute(
        select(Group).where(Group.id == group_id)
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise NotFoundError("Group")
    
    # Update fields
    if request.name is not None:
        group.name = request.name
    if request.description is not None:
        group.description = request.description
    
    await db.commit()
    await db.refresh(group)
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
    }


@router.delete("")
async def bulk_delete_groups(
    request: BulkDeleteRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/groups
    Bulk delete groups.
    """
    if not await can(db, context, "groups:delete"):
        raise RBACError("groups:delete")
    
    if not request.ids:
        raise BadRequestError("No group IDs provided")
    
    # Delete groups
    result = await db.execute(
        Group.__table__.delete().where(Group.id.in_(request.ids))
    )
    
    await db.commit()
    
    return {"success": True, "deleted": result.rowcount}
