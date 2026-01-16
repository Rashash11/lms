"""
Enrollment Routes

CRUD endpoints for course enrollments.
"""

from typing import Annotated, Any, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import AuthContext, RequireAuth
from app.db.models import Enrollment, Course, EnrollmentStatus
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can
from app.audit import log_audit_background, AuditEntry, AuditEventType

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateEnrollmentRequest(BaseModel):
    userId: str
    courseId: str


class EnrollmentListResponse(BaseModel):
    data: list[dict[str, Any]]
    stats: dict[str, int]
    pagination: dict[str, Any]


# ============= Endpoints =============

@router.get("")
async def list_enrollments(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    userId: Optional[str] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by course title/code"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """
    GET /api/enrollments
    List enrollments with pagination and filtering.
    """
    if not await can(db, context, "enrollments:read"):
        raise RBACError("enrollments:read")
    
    # Default to current user's enrollments
    target_user_id = userId or context.user_id
    skip = (page - 1) * limit
    
    # Build query
    query = select(Enrollment).where(Enrollment.user_id == target_user_id)
    count_query = select(func.count()).select_from(Enrollment).where(Enrollment.user_id == target_user_id)
    
    # Apply status filter
    if status and status != "all":
        query = query.where(Enrollment.status == status.upper())
        count_query = count_query.where(Enrollment.status == status.upper())
    
    # Apply search filter (requires join with course)
    if search:
        query = query.join(Course).where(
            Course.title.ilike(f"%{search}%") | Course.code.ilike(f"%{search}%")
        )
        count_query = count_query.join(Course).where(
            Course.title.ilike(f"%{search}%") | Course.code.ilike(f"%{search}%")
        )
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply pagination and include course
    query = query.options(selectinload(Enrollment.course)).offset(skip).limit(limit).order_by(Enrollment.updated_at.desc())
    
    # Execute query
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    # Calculate stats
    stats_result = await db.execute(
        select(Enrollment.status, func.count(Enrollment.id))
        .where(Enrollment.user_id == target_user_id)
        .group_by(Enrollment.status)
    )
    
    stats = {"total": 0, "inProgress": 0, "completed": 0, "notStarted": 0}
    for row in stats_result:
        status_val, count = row
        stats["total"] += count
        if status_val == EnrollmentStatus.IN_PROGRESS:
            stats["inProgress"] = count
        elif status_val == EnrollmentStatus.COMPLETED:
            stats["completed"] = count
        elif status_val == EnrollmentStatus.NOT_STARTED:
            stats["notStarted"] = count
    
    # Transform for response
    enrollments_data = []
    for enrollment in enrollments:
        course_data = None
        if enrollment.course:
            course_data = {
                "id": enrollment.course.id,
                "code": enrollment.course.code,
                "title": enrollment.course.title,
                "description": enrollment.course.description,
                "thumbnail_url": enrollment.course.thumbnail_url,
                "status": enrollment.course.status.value if hasattr(enrollment.course.status, 'value') else str(enrollment.course.status),
            }
        
        enrollments_data.append({
            "id": enrollment.id,
            "userId": enrollment.user_id,
            "courseId": enrollment.course_id,
            "status": enrollment.status.value if hasattr(enrollment.status, 'value') else str(enrollment.status),
            "progress": enrollment.progress,
            "score": float(enrollment.score) if enrollment.score else None,
            "startedAt": enrollment.started_at.isoformat() if enrollment.started_at else None,
            "completedAt": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
            "createdAt": enrollment.created_at.isoformat() if enrollment.created_at else None,
            "course": course_data,
        })
    
    return {
        "data": enrollments_data,
        "stats": stats,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


@router.post("")
async def create_enrollment(
    request: CreateEnrollmentRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/enrollments
    Enroll a user in a course.
    """
    if not await can(db, context, "enrollments:create"):
        raise RBACError("enrollments:create")
    
    user_id = request.userId
    course_id = request.courseId
    
    # Check if course exists and is published
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise NotFoundError("Course")
    
    if course.status != "PUBLISHED":
        raise BadRequestError("Cannot enroll in unpublished course")
    
    # Check if already enrolled
    existing_result = await db.execute(
        select(Enrollment).where(
            and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise BadRequestError("Already enrolled in this course")
    
    # Create enrollment
    enrollment = Enrollment(
        user_id=user_id,
        course_id=course_id,
        status=EnrollmentStatus.NOT_STARTED,
        progress=0,
    )
    
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    # Log audit event
    log_audit_background(AuditEntry(
        event_type=AuditEventType.ENROLLMENT_CREATE,
        tenant_id=context.tenant_id,
        user_id=context.user_id,
        target_user_id=user_id,
        resource_type="Enrollment",
        resource_id=enrollment.id,
        after_state={"userId": user_id, "courseId": course_id},
    ))
    
    return {
        "id": enrollment.id,
        "userId": enrollment.user_id,
        "courseId": enrollment.course_id,
        "status": enrollment.status.value if hasattr(enrollment.status, 'value') else str(enrollment.status),
        "progress": enrollment.progress,
        "createdAt": enrollment.created_at.isoformat() if enrollment.created_at else None,
    }


@router.delete("/{enrollment_id}")
async def delete_enrollment(
    enrollment_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/enrollments/{enrollment_id}
    Remove an enrollment.
    """
    if not await can(db, context, "enrollments:delete"):
        raise RBACError("enrollments:delete")
    
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise NotFoundError("Enrollment")
    
    # Store for audit
    before_state = {
        "userId": enrollment.user_id,
        "courseId": enrollment.course_id,
        "status": str(enrollment.status),
    }
    
    await db.delete(enrollment)
    await db.commit()
    
    # Log audit event
    log_audit_background(AuditEntry(
        event_type=AuditEventType.ENROLLMENT_DELETE,
        tenant_id=context.tenant_id,
        user_id=context.user_id,
        resource_type="Enrollment",
        resource_id=enrollment_id,
        before_state=before_state,
    ))
    
    return {"success": True, "deleted": enrollment_id}
