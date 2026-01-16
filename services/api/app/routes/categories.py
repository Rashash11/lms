"""
Category Routes

CRUD endpoints for course categories with hierarchy support.
"""

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, RequireAuth
from app.db.models import Category
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=1)
    description: Optional[str] = None
    parentId: Optional[str] = None
    price: Optional[float] = None


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parentId: Optional[str] = None
    price: Optional[float] = None


class BulkDeleteRequest(BaseModel):
    ids: list[str]


# ============= Endpoints =============

@router.get("")
async def list_categories(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    flat: Optional[str] = Query(None, description="Return flat list (true/false)"),
    search: Optional[str] = Query(None, description="Search by name"),
) -> dict[str, Any]:
    """
    GET /api/categories
    List all categories with optional hierarchy.
    """
    if not await can(db, context, "categories:read"):
        raise RBACError("categories:read")
    
    # Build query
    query = select(Category)
    
    # Apply search filter
    if search:
        query = query.where(Category.name.ilike(f"%{search}%"))
    
    query = query.order_by(Category.name.asc())
    
    # Execute query
    result = await db.execute(query)
    categories = result.scalars().all()
    
    # Transform to dict format
    categories_data = []
    for cat in categories:
        categories_data.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "parentId": cat.parent_id,
            "createdAt": cat.created_at.isoformat() if cat.created_at else None,
        })
    
    # Return flat list if requested
    if flat and flat.lower() == "true":
        return {"data": categories_data}
    
    # Build hierarchy
    category_map = {cat["id"]: {**cat, "children": []} for cat in categories_data}
    roots = []
    
    for cat in categories_data:
        node = category_map[cat["id"]]
        if cat["parentId"] and cat["parentId"] in category_map:
            category_map[cat["parentId"]]["children"].append(node)
        else:
            roots.append(node)
    
    # Build path strings (A > B > C)
    def build_path(node: dict, parent_path: str = "") -> dict:
        path = f"{parent_path} > {node['name']}" if parent_path else node["name"]
        return {
            **node,
            "path": path,
            "children": [build_path(child, path) for child in node["children"]],
        }
    
    hierarchy = [build_path(root) for root in roots]
    
    return {
        "data": hierarchy,
        "total": len(categories_data),
    }


@router.post("")
async def create_category(
    request: CreateCategoryRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/categories
    Create a new category.
    """
    if not await can(db, context, "categories:create"):
        raise RBACError("categories:create")
    
    # Check if user is admin
    if context.role != "ADMIN":
        raise RBACError("categories:create")
    
    # Check parent exists if provided
    if request.parentId:
        parent_result = await db.execute(
            select(Category).where(Category.id == request.parentId)
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise BadRequestError("Parent category not found")
    
    # Create category
    category = Category(
        name=request.name,
        description=request.description,
        parent_id=request.parentId,
    )
    
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "parentId": category.parent_id,
        "createdAt": category.created_at.isoformat() if category.created_at else None,
    }


@router.get("/{category_id}")
async def get_category(
    category_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/categories/{category_id}
    Get a single category by ID.
    """
    if not await can(db, context, "categories:read"):
        raise RBACError("categories:read")
    
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise NotFoundError("Category")
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "parentId": category.parent_id,
        "createdAt": category.created_at.isoformat() if category.created_at else None,
    }


@router.put("/{category_id}")
async def update_category(
    category_id: str,
    request: UpdateCategoryRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PUT /api/categories/{category_id}
    Update a category.
    """
    if not await can(db, context, "categories:update"):
        raise RBACError("categories:update")
    
    if context.role != "ADMIN":
        raise RBACError("categories:update")
    
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise NotFoundError("Category")
    
    # Update fields
    if request.name is not None:
        category.name = request.name
    if request.description is not None:
        category.description = request.description
    if request.parentId is not None:
        # Prevent circular reference
        if request.parentId == category_id:
            raise BadRequestError("Category cannot be its own parent")
        category.parent_id = request.parentId
    
    await db.commit()
    await db.refresh(category)
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "parentId": category.parent_id,
    }


@router.delete("")
async def bulk_delete_categories(
    request: BulkDeleteRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/categories
    Bulk delete categories.
    """
    if not await can(db, context, "categories:delete"):
        raise RBACError("categories:delete")
    
    if context.role != "ADMIN":
        raise RBACError("categories:delete")
    
    if not request.ids:
        raise BadRequestError("No category IDs provided")
    
    # Update children to have no parent (prevent orphans)
    await db.execute(
        Category.__table__.update()
        .where(Category.parent_id.in_(request.ids))
        .values(parent_id=None)
    )
    
    # Delete categories
    result = await db.execute(
        Category.__table__.delete().where(Category.id.in_(request.ids))
    )
    
    await db.commit()
    
    return {"success": True, "deleted": result.rowcount}
