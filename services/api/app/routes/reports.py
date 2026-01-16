"""
Reports Routes

Endpoints for generating and exporting reports.
"""

from typing import Annotated, Any, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, RequireAuth
from app.db.models import Enrollment, User, Course, EnrollmentStatus
from app.db.session import get_db
from app.errors import RBACError
from app.rbac import can
from app.jobs.tasks import report_generate

router = APIRouter()


# ============= Request/Response Schemas =============

class GenerateReportRequest(BaseModel):
    reportType: str = Field(description="Type of report: course_progress, user_activity, enrollment")
    format: Optional[str] = "xlsx"
    filters: Optional[dict] = None
    recipients: Optional[list[str]] = None


# ============= Endpoints =============

@router.get("/dashboard")
async def get_dashboard_stats(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/reports/dashboard
    Get dashboard statistics.
    """
    if not await can(db, context, "reports:read"):
        raise RBACError("reports:read")
    
    # Get user count
    user_count_result = await db.execute(
        select(func.count()).select_from(User)
    )
    total_users = user_count_result.scalar() or 0
    
    # Get active users (logged in within last 30 days)
    thirty_days_ago = datetime.now(timezone.utc).replace(day=1)
    active_users_result = await db.execute(
        select(func.count()).select_from(User).where(
            User.last_login_at >= thirty_days_ago
        )
    )
    active_users = active_users_result.scalar() or 0
    
    # Get course count
    course_count_result = await db.execute(
        select(func.count()).select_from(Course)
    )
    total_courses = course_count_result.scalar() or 0
    
    # Get enrollment stats
    enrollment_stats_result = await db.execute(
        select(
            Enrollment.status,
            func.count(Enrollment.id)
        ).group_by(Enrollment.status)
    )
    
    enrollment_stats = {
        "total": 0,
        "completed": 0,
        "inProgress": 0,
        "notStarted": 0,
    }
    
    for row in enrollment_stats_result:
        status, count = row
        enrollment_stats["total"] += count
        if status == EnrollmentStatus.COMPLETED:
            enrollment_stats["completed"] = count
        elif status == EnrollmentStatus.IN_PROGRESS:
            enrollment_stats["inProgress"] = count
        elif status == EnrollmentStatus.NOT_STARTED:
            enrollment_stats["notStarted"] = count
    
    # Calculate completion rate
    completion_rate = 0
    if enrollment_stats["total"] > 0:
        completion_rate = round(enrollment_stats["completed"] / enrollment_stats["total"] * 100, 1)
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
        },
        "courses": {
            "total": total_courses,
        },
        "enrollments": enrollment_stats,
        "completionRate": completion_rate,
    }


@router.get("/course-progress")
async def get_course_progress_report(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    courseId: Optional[str] = Query(None, description="Filter by course ID"),
) -> dict[str, Any]:
    """
    GET /api/reports/course-progress
    Get course progress report.
    """
    if not await can(db, context, "reports:read"):
        raise RBACError("reports:read")
    
    # Build query
    query = (
        select(
            Course.id,
            Course.title,
            Course.code,
            func.count(Enrollment.id).label("total_enrollments"),
            func.sum(
                func.case(
                    (Enrollment.status == EnrollmentStatus.COMPLETED, 1),
                    else_=0
                )
            ).label("completed"),
            func.avg(Enrollment.progress).label("avg_progress"),
        )
        .join(Enrollment, Enrollment.course_id == Course.id, isouter=True)
        .group_by(Course.id, Course.title, Course.code)
    )
    
    if courseId:
        query = query.where(Course.id == courseId)
    
    result = await db.execute(query)
    rows = result.all()
    
    # Transform for response
    courses_data = []
    for row in rows:
        courses_data.append({
            "courseId": row[0],
            "title": row[1],
            "code": row[2],
            "totalEnrollments": row[3] or 0,
            "completed": row[4] or 0,
            "avgProgress": float(row[5]) if row[5] else 0,
            "completionRate": round((row[4] or 0) / (row[3] or 1) * 100, 1),
        })
    
    return {"data": courses_data}


@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/reports/generate
    Queue a report generation job.
    """
    if not await can(db, context, "reports:create"):
        raise RBACError("reports:create")
    
    # Queue the report generation task
    task = report_generate.delay(
        report_id=request.reportType,
        tenant_id=context.tenant_id or "",
        user_id=context.user_id,
        format=request.format or "xlsx",
        filters=request.filters,
        recipients=request.recipients,
    )
    
    return {
        "success": True,
        "taskId": task.id,
        "message": "Report generation queued",
    }


@router.get("/user-activity")
async def get_user_activity_report(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
) -> dict[str, Any]:
    """
    GET /api/reports/user-activity
    Get user activity report.
    """
    if not await can(db, context, "reports:read"):
        raise RBACError("reports:read")
    
    from datetime import timedelta
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Get new users in period
    new_users_result = await db.execute(
        select(func.count()).select_from(User).where(
            User.created_at >= cutoff
        )
    )
    new_users = new_users_result.scalar() or 0
    
    # Get active users (logged in during period)
    active_users_result = await db.execute(
        select(func.count()).select_from(User).where(
            User.last_login_at >= cutoff
        )
    )
    active_users = active_users_result.scalar() or 0
    
    # Get new enrollments in period
    new_enrollments_result = await db.execute(
        select(func.count()).select_from(Enrollment).where(
            Enrollment.created_at >= cutoff
        )
    )
    new_enrollments = new_enrollments_result.scalar() or 0
    
    # Get completions in period
    completions_result = await db.execute(
        select(func.count()).select_from(Enrollment).where(
            Enrollment.completed_at >= cutoff
        )
    )
    completions = completions_result.scalar() or 0
    
    return {
        "period": f"Last {days} days",
        "newUsers": new_users,
        "activeUsers": active_users,
        "newEnrollments": new_enrollments,
        "completions": completions,
    }
