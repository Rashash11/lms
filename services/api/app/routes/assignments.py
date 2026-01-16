"""
Assignment Routes

CRUD endpoints for assignments with role-based access control.
"""

from typing import Annotated, Any, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import AuthContext, RequireAuth
from app.db.models import Assignment, Course, Enrollment
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError, ForbiddenError
from app.rbac import can
from app.jobs.tasks import timeline_add_event

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateAssignmentRequest(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    courseId: Optional[str] = None
    dueAt: Optional[str] = None


class UpdateAssignmentRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    dueAt: Optional[str] = None


# ============= Endpoints =============

@router.get("")
async def list_assignments(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    courseId: Optional[str] = Query(None, description="Filter by course ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """
    GET /api/assignments
    List assignments based on role.
    """
    if not await can(db, context, "assignment:read"):
        raise RBACError("assignment:read")
    
    skip = (page - 1) * limit
    
    # Build base query
    query = select(Assignment)
    count_query = select(func.count()).select_from(Assignment)
    
    # Apply course filter
    if courseId:
        query = query.where(Assignment.course_id == courseId)
        count_query = count_query.where(Assignment.course_id == courseId)
    
    # ROLE-BASED ACCESS CONTROL
    if context.role == "LEARNER":
        # Learners only see assignments from enrolled courses
        enrollment_query = select(Enrollment.course_id).where(
            Enrollment.user_id == context.user_id
        )
        enrollment_result = await db.execute(enrollment_query)
        enrolled_course_ids = [row[0] for row in enrollment_result.all()]
        
        if courseId:
            if courseId not in enrolled_course_ids:
                raise ForbiddenError("Not enrolled in this course")
        else:
            query = query.where(Assignment.course_id.in_(enrolled_course_ids))
            count_query = count_query.where(Assignment.course_id.in_(enrolled_course_ids))
    
    elif context.role == "INSTRUCTOR":
        # Instructors see assignments from courses they manage
        if courseId:
            course_result = await db.execute(
                select(Course).where(Course.id == courseId)
            )
            course = course_result.scalar_one_or_none()
            
            if not course:
                raise NotFoundError("Course")
            
            if course.instructor_id != context.user_id:
                raise ForbiddenError("You do not manage this course")
        else:
            managed_query = select(Course.id).where(
                Course.instructor_id == context.user_id
            )
            managed_result = await db.execute(managed_query)
            managed_course_ids = [row[0] for row in managed_result.all()]
            
            query = query.where(Assignment.course_id.in_(managed_course_ids))
            count_query = count_query.where(Assignment.course_id.in_(managed_course_ids))
    
    # ADMIN/SUPER_INSTRUCTOR see all (tenant-scoped by middleware)
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Include course and apply pagination
    query = (
        query
        .options(selectinload(Assignment.course))
        .offset(skip)
        .limit(limit)
        .order_by(Assignment.created_at.desc())
    )
    
    # Execute query
    result = await db.execute(query)
    assignments = result.scalars().all()
    
    # Transform for response
    assignments_data = []
    for assignment in assignments:
        course_data = None
        if assignment.course:
            course_data = {
                "title": assignment.course.title,
                "code": assignment.course.code,
            }
        
        assignments_data.append({
            "id": assignment.id,
            "title": assignment.title,
            "description": assignment.description,
            "courseId": assignment.course_id,
            "dueAt": assignment.due_at.isoformat() if assignment.due_at else None,
            "createdAt": assignment.created_at.isoformat() if assignment.created_at else None,
            "course": course_data,
        })
    
    return {
        "data": assignments_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


@router.post("")
async def create_assignment(
    request: CreateAssignmentRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/assignments
    Create a new assignment.
    """
    if not await can(db, context, "assignment:create"):
        raise RBACError("assignment:create")
    
    # Check course permissions for instructors
    if context.role == "INSTRUCTOR" and request.courseId:
        course_result = await db.execute(
            select(Course).where(Course.id == request.courseId)
        )
        course = course_result.scalar_one_or_none()
        
        if not course:
            raise NotFoundError("Course")
        
        if course.instructor_id != context.user_id:
            raise ForbiddenError("You do not have permission to manage this course")
    
    # Parse due date
    due_at = None
    if request.dueAt:
        try:
            due_at = datetime.fromisoformat(request.dueAt.replace("Z", "+00:00"))
        except ValueError:
            raise BadRequestError("Invalid due date format")
    
    # Create assignment
    assignment = Assignment(
        title=request.title,
        description=request.description,
        course_id=request.courseId,
        due_at=due_at,
        created_by=context.user_id,
    )
    
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    
    # Queue timeline event
    if request.courseId and context.tenant_id:
        timeline_add_event.delay(
            user_id=context.user_id,
            tenant_id=context.tenant_id,
            event_type="ASSIGNMENT_CREATED",
            course_id=request.courseId,
            details={"assignmentId": assignment.id, "title": request.title},
        )
    
    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "courseId": assignment.course_id,
        "dueAt": assignment.due_at.isoformat() if assignment.due_at else None,
        "createdAt": assignment.created_at.isoformat() if assignment.created_at else None,
    }


@router.get("/{assignment_id}")
async def get_assignment(
    assignment_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/assignments/{assignment_id}
    Get a single assignment by ID.
    """
    if not await can(db, context, "assignment:read"):
        raise RBACError("assignment:read")
    
    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.course))
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise NotFoundError("Assignment")
    
    course_data = None
    if assignment.course:
        course_data = {
            "id": assignment.course.id,
            "title": assignment.course.title,
            "code": assignment.course.code,
        }
    
    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "courseId": assignment.course_id,
        "dueAt": assignment.due_at.isoformat() if assignment.due_at else None,
        "createdAt": assignment.created_at.isoformat() if assignment.created_at else None,
        "course": course_data,
    }


@router.put("/{assignment_id}")
async def update_assignment(
    assignment_id: str,
    request: UpdateAssignmentRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PUT /api/assignments/{assignment_id}
    Update an assignment.
    """
    if not await can(db, context, "assignment:update"):
        raise RBACError("assignment:update")
    
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise NotFoundError("Assignment")
    
    # Update fields
    if request.title is not None:
        assignment.title = request.title
    if request.description is not None:
        assignment.description = request.description
    if request.dueAt is not None:
        try:
            assignment.due_at = datetime.fromisoformat(request.dueAt.replace("Z", "+00:00"))
        except ValueError:
            raise BadRequestError("Invalid due date format")
    
    await db.commit()
    await db.refresh(assignment)
    
    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "dueAt": assignment.due_at.isoformat() if assignment.due_at else None,
    }


@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/assignments/{assignment_id}
    Delete an assignment.
    """
    if not await can(db, context, "assignment:delete"):
        raise RBACError("assignment:delete")
    
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise NotFoundError("Assignment")
    
    await db.delete(assignment)
    await db.commit()
    
    return {"success": True, "deleted": assignment_id}
