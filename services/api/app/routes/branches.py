"""
Branch Routes

CRUD endpoints for tenant branches (nodes).
"""

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import AuthContext, RequireAuth
from app.db.models import Branch, Tenant
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can

router = APIRouter()


# ============= Helper Functions =============

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name."""
    import re
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9-]', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


# ============= Request/Response Schemas =============

class CreateBranchRequest(BaseModel):
    name: str = Field(min_length=1)
    slug: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = False
    languageCode: Optional[str] = "en"
    timezone: Optional[str] = "UTC"
    settings: Optional[dict] = None


class UpdateBranchRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None
    languageCode: Optional[str] = None
    timezone: Optional[str] = None
    settings: Optional[dict] = None


class BulkDeleteRequest(BaseModel):
    ids: list[str]


# ============= Endpoints =============

@router.get("")
async def list_branches(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None, description="Search by name, slug, or title"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """
    GET /api/branches
    List all branches with pagination.
    """
    if not await can(db, context, "branches:read"):
        raise RBACError("branches:read")
    
    skip = (page - 1) * limit
    
    # Build query
    query = select(Branch)
    count_query = select(func.count()).select_from(Branch)
    
    # Apply search filter
    if search:
        search_filter = or_(
            Branch.name.ilike(f"%{search}%"),
            Branch.slug.ilike(f"%{search}%"),
            Branch.title.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply pagination and include tenant
    query = query.options(selectinload(Branch.tenant)).offset(skip).limit(limit).order_by(Branch.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    branches = result.scalars().all()
    
    # Transform for response
    branches_data = []
    for branch in branches:
        tenant_data = None
        if branch.tenant:
            tenant_data = {
                "name": branch.tenant.name,
                "domain": branch.tenant.domain,
            }
        
        branches_data.append({
            "id": branch.id,
            "tenantId": branch.tenant_id,
            "name": branch.name,
            "slug": branch.slug,
            "title": branch.title,
            "description": branch.description,
            "isActive": branch.is_active,
            "defaultLanguage": branch.default_language,
            "settings": branch.settings,
            "createdAt": branch.created_at.isoformat() if branch.created_at else None,
            "updatedAt": branch.updated_at.isoformat() if branch.updated_at else None,
            "tenant": tenant_data,
        })
    
    return {
        "data": branches_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


@router.post("")
async def create_branch(
    request: CreateBranchRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/branches
    Create a new branch (admin only).
    """
    if not await can(db, context, "branches:create"):
        raise RBACError("branches:create")
    
    if context.role != "ADMIN":
        raise RBACError("branches:create")
    
    # Generate slug
    slug = request.slug or generate_slug(request.name)
    
    # Get tenant from context or find/create default
    tenant_id = context.tenant_id
    
    if not tenant_id:
        # Fallback to first tenant or create default
        tenant_result = await db.execute(select(Tenant).limit(1))
        tenant = tenant_result.scalar_one_or_none()
        
        if not tenant:
            tenant = Tenant(
                domain="default.local",
                name="Default Tenant",
                settings={},
            )
            db.add(tenant)
            await db.flush()
        
        tenant_id = tenant.id
    
    # Check slug uniqueness within tenant
    existing_result = await db.execute(
        select(Branch).where(Branch.tenant_id == tenant_id, Branch.slug == slug)
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise BadRequestError("Branch with this slug already exists")
    
    # Create branch
    branch = Branch(
        tenant_id=tenant_id,
        name=request.name,
        slug=slug,
        title=request.title,
        description=request.description,
        is_active=request.isActive or False,
        default_language=request.languageCode or "en",
        settings=request.settings or {},
    )
    
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    
    return {
        "id": branch.id,
        "tenantId": branch.tenant_id,
        "name": branch.name,
        "slug": branch.slug,
        "title": branch.title,
        "description": branch.description,
        "isActive": branch.is_active,
        "createdAt": branch.created_at.isoformat() if branch.created_at else None,
    }


@router.get("/{branch_id}")
async def get_branch(
    branch_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/branches/{branch_id}
    Get a single branch by ID.
    """
    if not await can(db, context, "branches:read"):
        raise RBACError("branches:read")
    
    result = await db.execute(
        select(Branch).options(selectinload(Branch.tenant)).where(Branch.id == branch_id)
    )
    branch = result.scalar_one_or_none()
    
    if not branch:
        raise NotFoundError("Branch")
    
    tenant_data = None
    if branch.tenant:
        tenant_data = {
            "name": branch.tenant.name,
            "domain": branch.tenant.domain,
        }
    
    return {
        "id": branch.id,
        "tenantId": branch.tenant_id,
        "name": branch.name,
        "slug": branch.slug,
        "title": branch.title,
        "description": branch.description,
        "isActive": branch.is_active,
        "defaultLanguage": branch.default_language,
        "settings": branch.settings,
        "createdAt": branch.created_at.isoformat() if branch.created_at else None,
        "updatedAt": branch.updated_at.isoformat() if branch.updated_at else None,
        "tenant": tenant_data,
    }


@router.put("/{branch_id}")
async def update_branch(
    branch_id: str,
    request: UpdateBranchRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PUT /api/branches/{branch_id}
    Update a branch.
    """
    if not await can(db, context, "branches:update"):
        raise RBACError("branches:update")
    
    if context.role != "ADMIN":
        raise RBACError("branches:update")
    
    result = await db.execute(
        select(Branch).where(Branch.id == branch_id)
    )
    branch = result.scalar_one_or_none()
    
    if not branch:
        raise NotFoundError("Branch")
    
    # Update fields
    if request.name is not None:
        branch.name = request.name
    if request.title is not None:
        branch.title = request.title
    if request.description is not None:
        branch.description = request.description
    if request.isActive is not None:
        branch.is_active = request.isActive
    if request.languageCode is not None:
        branch.default_language = request.languageCode
    if request.settings is not None:
        branch.settings = request.settings
    
    await db.commit()
    await db.refresh(branch)
    
    return {
        "id": branch.id,
        "name": branch.name,
        "slug": branch.slug,
        "isActive": branch.is_active,
    }


@router.delete("")
async def bulk_delete_branches(
    request: BulkDeleteRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/branches
    Bulk delete branches (admin only).
    """
    if not await can(db, context, "branches:delete"):
        raise RBACError("branches:delete")
    
    if context.role != "ADMIN":
        raise RBACError("branches:delete")
    
    if not request.ids:
        raise BadRequestError("No branch IDs provided")
    
    # Delete branches
    result = await db.execute(
        Branch.__table__.delete().where(Branch.id.in_(request.ids))
    )
    
    await db.commit()
    
    return {"success": True, "deleted": result.rowcount}
