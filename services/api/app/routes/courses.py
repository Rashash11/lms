"""
Course Routes

CRUD endpoints for course management with RBAC.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, RequireAuth
from app.db.models import Course, CourseStatus
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateCourseRequest(BaseModel):
    title: str = Field(min_length=1)
    code: str | None = None
    description: str | None = None
    status: str | None = None
    image: str | None = None
    isActive: bool | None = None
    hiddenFromCatalog: bool | None = None
    categoryId: str | None = None


class UpdateCourseRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    image: str | None = None
    isActive: bool | None = None
    hiddenFromCatalog: bool | None = None
    categoryId: str | None = None


class BulkActionRequest(BaseModel):
    ids: list[str]
    action: str


class CourseListResponse(BaseModel):
    courses: list[dict[str, Any]]
    total: int
    page: int
    limit: int
    totalPages: int


# ============= Endpoints =============

@router.get("")
async def list_courses(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str = Query("", description="Search by title, code, or description"),
    status: str = Query("", description="Filter by status"),
    hidden: str | None = Query(None, description="Filter by hiddenFromCatalog"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> CourseListResponse:
    """
    List courses with pagination and filtering.
    """
    if not await can(db, context, "course:read"):
        raise RBACError("course:read")
    
    # Build query
    query = select(Course)
    count_query = select(func.count()).select_from(Course)
    
    # Apply search filter
    if search:
        search_filter = (
            Course.title.ilike(f"%{search}%") |
            Course.code.ilike(f"%{search}%") |
            Course.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Apply status filter
    if status and status != "all":
        query = query.where(Course.status == status.upper())
        count_query = count_query.where(Course.status == status.upper())
    
    # Apply hidden filter
    if hidden is not None:
        is_hidden = hidden.lower() == "true"
        query = query.where(Course.hidden_from_catalog == is_hidden)
        count_query = count_query.where(Course.hidden_from_catalog == is_hidden)
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply pagination
    skip = (page - 1) * limit
    query = query.offset(skip).limit(limit).order_by(Course.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    courses = result.scalars().all()
    
    # Transform for response
    courses_data = []
    for course in courses:
        courses_data.append({
            "id": course.id,
            "code": course.code,
            "title": course.title,
            "description": course.description,
            "status": course.status.value if hasattr(course.status, 'value') else str(course.status),
            "isActive": course.is_active,
            "hiddenFromCatalog": course.hidden_from_catalog,
            "thumbnail_url": course.thumbnail_url,
            "categoryId": course.category_id,
            "createdAt": course.created_at.isoformat() if course.created_at else None,
        })
    
    return CourseListResponse(
        courses=courses_data,
        total=total,
        page=page,
        limit=limit,
        totalPages=(total + limit - 1) // limit,
    )


@router.post("")
async def create_course(
    request: CreateCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Create a new course.
    """
    if not await can(db, context, "course:create"):
        raise RBACError("course:create")
    
    # Auto-generate code if not provided
    code = request.code or f"COURSE-{int(__import__('time').time())}"
    
    # Check if code exists
    result = await db.execute(
        select(Course).where(Course.code == code)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestError("Course with this code already exists")
    
    # Create course
    course = Course(
        code=code,
        title=request.title,
        description=request.description,
        status=request.status or "DRAFT",
        thumbnail_url=request.image,
        is_active=request.isActive or False,
        hidden_from_catalog=request.hiddenFromCatalog or False,
        category_id=request.categoryId,
        instructor_id=context.user_id,
    )
    
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "description": course.description,
        "status": course.status.value if hasattr(course.status, 'value') else str(course.status),
        "isActive": course.is_active,
        "hiddenFromCatalog": course.hidden_from_catalog,
        "createdAt": course.created_at.isoformat() if course.created_at else None,
    }


@router.get("/{course_id}")
async def get_course(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Get a single course by ID.
    """
    if not await can(db, context, "course:read"):
        raise RBACError("course:read")
    
    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundError("Course")
    
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "description": course.description,
        "status": course.status.value if hasattr(course.status, 'value') else str(course.status),
        "isActive": course.is_active,
        "hiddenFromCatalog": course.hidden_from_catalog,
        "thumbnail_url": course.thumbnail_url,
        "categoryId": course.category_id,
        "instructorId": course.instructor_id,
        "createdAt": course.created_at.isoformat() if course.created_at else None,
        "updatedAt": course.updated_at.isoformat() if course.updated_at else None,
    }


@router.put("/{course_id}")
async def update_course(
    course_id: str,
    request: UpdateCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Update a course.
    """
    has_update = await can(db, context, "course:update")
    has_update_any = await can(db, context, "course:update_any")
    
    if not has_update and not has_update_any:
        raise RBACError("course:update")
    
    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundError("Course")
    
    # Update fields
    if request.title is not None:
        course.title = request.title
    if request.description is not None:
        course.description = request.description
    if request.status is not None:
        course.status = request.status
    if request.image is not None:
        course.thumbnail_url = request.image
    if request.isActive is not None:
        course.is_active = request.isActive
    if request.hiddenFromCatalog is not None:
        course.hidden_from_catalog = request.hiddenFromCatalog
    if request.categoryId is not None:
        course.category_id = request.categoryId
    
    await db.commit()
    await db.refresh(course)
    
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "status": course.status.value if hasattr(course.status, 'value') else str(course.status),
    }


@router.delete("")
async def bulk_delete_courses(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk delete courses.
    """
    if not await can(db, context, "course:delete_any"):
        raise RBACError("course:delete_any")
    
    if not request.ids:
        raise BadRequestError("No course IDs provided")
    
    result = await db.execute(
        Course.__table__.delete().where(Course.id.in_(request.ids))
    )
    
    await db.commit()
    
    return {"success": True, "deleted": result.rowcount}


@router.patch("")
async def bulk_update_courses(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk update courses (publish, unpublish, hide, show).
    """
    has_update = await can(db, context, "course:update_any")
    has_publish = await can(db, context, "course:publish")
    
    if not has_update and not has_publish:
        raise RBACError("course:update_any")
    
    if not request.ids:
        raise BadRequestError("No course IDs provided")
    
    update_data = {}
    
    if request.action == "publish":
        update_data = {"status": "PUBLISHED"}
    elif request.action == "unpublish":
        update_data = {"status": "DRAFT"}
    elif request.action == "hide":
        update_data = {"hidden_from_catalog": True}
    elif request.action == "show":
        update_data = {"hidden_from_catalog": False}
    else:
        raise BadRequestError("Invalid action")
    
    result = await db.execute(
        Course.__table__.update()
        .where(Course.id.in_(request.ids))
        .values(**update_data)
    )
    
    await db.commit()
    
    return {"success": True, "updated": result.rowcount}
