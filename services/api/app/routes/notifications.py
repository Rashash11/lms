"""
Notification Routes

CRUD endpoints for in-app notifications.
"""

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthContext, RequireAuth
from app.db.models import Notification
from app.db.session import get_db
from app.errors import NotFoundError, RBACError
from app.rbac import can

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateNotificationRequest(BaseModel):
    title: str = Field(min_length=1)
    body: str
    recipientId: str
    link: Optional[str] = None
    type: Optional[str] = "in_app"


class MarkReadRequest(BaseModel):
    notificationIds: list[str]


# ============= Endpoints =============

@router.get("")
async def list_notifications(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    unreadOnly: Optional[str] = Query(None, description="Only show unread (true/false)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """
    GET /api/notifications
    List notifications for the current user.
    """
    if not await can(db, context, "notifications:read"):
        raise RBACError("notifications:read")
    
    skip = (page - 1) * limit
    
    # Build query - filter by current user
    query = select(Notification).where(Notification.user_id == context.user_id)
    count_query = select(func.count()).select_from(Notification).where(
        Notification.user_id == context.user_id
    )
    
    # Apply unread filter
    if unreadOnly and unreadOnly.lower() == "true":
        query = query.where(Notification.read_at.is_(None))
        count_query = count_query.where(Notification.read_at.is_(None))
    
    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Get unread count
    unread_count_result = await db.execute(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == context.user_id,
            Notification.read_at.is_(None),
        )
    )
    unread_count = unread_count_result.scalar() or 0
    
    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(Notification.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Transform for response
    notifications_data = []
    for notif in notifications:
        notifications_data.append({
            "id": notif.id,
            "title": notif.title,
            "body": notif.body,
            "type": notif.type,
            "link": notif.link,
            "readAt": notif.read_at.isoformat() if notif.read_at else None,
            "createdAt": notif.created_at.isoformat() if notif.created_at else None,
        })
    
    return {
        "data": notifications_data,
        "unreadCount": unread_count,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        }
    }


@router.post("/mark-read")
async def mark_notifications_read(
    request: MarkReadRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/notifications/mark-read
    Mark notifications as read.
    """
    from datetime import datetime, timezone
    
    if not request.notificationIds:
        return {"success": True, "updated": 0}
    
    # Update notifications belonging to current user
    result = await db.execute(
        update(Notification)
        .where(
            Notification.id.in_(request.notificationIds),
            Notification.user_id == context.user_id,
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    
    await db.commit()
    
    return {"success": True, "updated": result.rowcount}


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/notifications/mark-all-read
    Mark all notifications as read for current user.
    """
    from datetime import datetime, timezone
    
    result = await db.execute(
        update(Notification)
        .where(
            Notification.user_id == context.user_id,
            Notification.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    
    await db.commit()
    
    return {"success": True, "updated": result.rowcount}


@router.get("/{notification_id}")
async def get_notification(
    notification_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/notifications/{notification_id}
    Get a single notification.
    """
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == context.user_id,
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundError("Notification")
    
    return {
        "id": notification.id,
        "title": notification.title,
        "body": notification.body,
        "type": notification.type,
        "link": notification.link,
        "readAt": notification.read_at.isoformat() if notification.read_at else None,
        "createdAt": notification.created_at.isoformat() if notification.created_at else None,
    }


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/notifications/{notification_id}
    Delete a notification.
    """
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == context.user_id,
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundError("Notification")
    
    await db.delete(notification)
    await db.commit()
    
    return {"success": True, "deleted": notification_id}
