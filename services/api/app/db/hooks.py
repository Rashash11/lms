"""
SQLAlchemy Event Hooks for Multi-Tenancy and Soft Delete

This module replicates the Prisma extension behavior:
1. Auto-inject tenantId on INSERT
2. Auto-filter by tenantId on SELECT
3. Auto-filter soft-deleted records
4. Prevent cross-tenant updates

Usage:
    Import this module early in app startup to register event listeners.
    The hooks work transparently with the existing session factory.
"""

from __future__ import annotations

import logging
from contextvars import ContextVar
from datetime import datetime
from typing import Any

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session, ORMExecuteState

logger = logging.getLogger(__name__)

# ============= Context Variables =============
# These are set by the TenantMiddleware and read by the hooks

tenant_context: ContextVar[str | None] = ContextVar("tenant_context", default=None)
branch_context: ContextVar[str | None] = ContextVar("branch_context", default=None)
user_context: ContextVar[str | None] = ContextVar("user_context", default=None)

# Flag to bypass tenant filtering (for admin/seed operations)
bypass_tenant_filter: ContextVar[bool] = ContextVar("bypass_tenant_filter", default=False)


# ============= Model Configuration =============

# Models that bypass tenant scoping (global tables shared across tenants)
GLOBAL_MODELS = frozenset({
    "Tenant",
    "AuthRole", 
    "AuthPermission", 
    "AuthRolePermission",
    "UserType",
    "TalentLibraryCourse",
    "LRSStatement",
})

# Models with soft delete support (have deleted_at column)
SOFT_DELETE_MODELS = frozenset({
    "User",
    "Course", 
    "Enrollment",
    "LearningPath",
    "Group",
    "Tenant",
    "Branch",
    "Category",
})

# Models that require branch/node scoping for non-admin users
BRANCH_SCOPED_MODELS = frozenset({
    "User",
    "Group",
    "LearningPath",
})


# ============= Helper Functions =============

def _get_model_name(mapper) -> str:
    """Extract model class name from mapper."""
    if hasattr(mapper, 'class_'):
        return mapper.class_.__name__
    return str(mapper)


def _has_column(mapper, column_name: str) -> bool:
    """Check if model has a specific column."""
    try:
        columns = {c.key for c in mapper.columns}
        return column_name in columns
    except Exception:
        return False


def _is_global_model(model_name: str) -> bool:
    """Check if model bypasses tenant scoping."""
    return model_name in GLOBAL_MODELS


def _has_soft_delete(model_name: str) -> bool:
    """Check if model supports soft delete."""
    return model_name in SOFT_DELETE_MODELS


# ============= Query Filtering (SELECT) =============

@event.listens_for(Session, "do_orm_execute")
def _apply_tenant_and_softdelete_filter(orm_execute_state: ORMExecuteState):
    """
    Intercept all ORM SELECT queries and apply:
    1. Tenant filter (where tenant_id = current_tenant)
    2. Soft delete filter (where deleted_at IS NULL)
    
    This runs BEFORE every SELECT query.
    """
    # Only apply to SELECT statements
    if not orm_execute_state.is_select:
        return
    
    # Check bypass flag
    if bypass_tenant_filter.get():
        return
    
    tenant_id = tenant_context.get()
    
    # Get the mapper for the primary entity being queried
    # This handles simple selects; complex joins may need additional handling
    try:
        mapper = orm_execute_state.bind_arguments.get("mapper")
        if not mapper:
            # Try to extract from the statement
            if hasattr(orm_execute_state.statement, 'froms'):
                for from_clause in orm_execute_state.statement.froms:
                    if hasattr(from_clause, 'entity_namespace'):
                        mapper = inspect(from_clause.entity_namespace).mapper
                        break
        
        if not mapper:
            return
            
    except Exception as e:
        logger.debug(f"Could not extract mapper from query: {e}")
        return
    
    model_name = _get_model_name(mapper)
    model_class = mapper.class_
    
    # Skip global models
    if _is_global_model(model_name):
        return
    
    # Apply tenant filter if:
    # 1. We have a tenant context
    # 2. Model has tenant_id column
    if tenant_id and _has_column(mapper, "tenant_id"):
        orm_execute_state.statement = orm_execute_state.statement.filter(
            model_class.tenant_id == tenant_id
        )
    
    # Apply soft delete filter if:
    # 1. Model supports soft delete
    # 2. Model has deleted_at column
    if _has_soft_delete(model_name) and _has_column(mapper, "deleted_at"):
        orm_execute_state.statement = orm_execute_state.statement.filter(
            model_class.deleted_at.is_(None)
        )


# ============= Insert/Update Validation (before_flush) =============

@event.listens_for(Session, "before_flush")
def _inject_tenant_and_validate(session: Session, flush_context, instances):
    """
    Before any flush (INSERT/UPDATE):
    1. Auto-inject tenant_id on new objects
    2. Prevent cross-tenant updates
    3. Validate tenant_id is not being changed
    
    This is the last line of defense against data leakage.
    """
    tenant_id = tenant_context.get()
    
    # ===== Process NEW objects (INSERTs) =====
    for obj in session.new:
        model_name = obj.__class__.__name__
        
        # Skip global models
        if _is_global_model(model_name):
            continue
        
        # Auto-inject tenant_id if column exists and not set
        if hasattr(obj, "tenant_id"):
            if obj.tenant_id is None:
                if tenant_id:
                    obj.tenant_id = tenant_id
                    logger.debug(f"Auto-injected tenant_id={tenant_id} into {model_name}")
                elif not bypass_tenant_filter.get():
                    # In production, we should require tenant context
                    import os
                    if os.environ.get("NODE_ENV") == "production":
                        raise ValueError(
                            f"Tenant context required for creating {model_name}"
                        )
            elif obj.tenant_id != tenant_id and tenant_id and not bypass_tenant_filter.get():
                # Attempting to create object with different tenant_id
                raise ValueError(
                    f"Cannot create {model_name} with tenant_id={obj.tenant_id} "
                    f"in tenant context {tenant_id}"
                )
    
    # ===== Process DIRTY objects (UPDATEs) =====
    for obj in session.dirty:
        model_name = obj.__class__.__name__
        
        # Skip global models
        if _is_global_model(model_name):
            continue
        
        # Prevent tenant_id changes
        if hasattr(obj, "tenant_id"):
            state = inspect(obj)
            history = state.attrs.tenant_id.history
            
            if history.has_changes():
                old_value = history.deleted[0] if history.deleted else None
                new_value = history.added[0] if history.added else None
                
                if old_value != new_value:
                    raise ValueError(
                        f"Cannot change tenant_id of {model_name} "
                        f"from {old_value} to {new_value}"
                    )
        
        # Validate current tenant context matches object's tenant
        if hasattr(obj, "tenant_id") and tenant_id and not bypass_tenant_filter.get():
            if obj.tenant_id and obj.tenant_id != tenant_id:
                raise ValueError(
                    f"Cannot update {model_name} belonging to tenant {obj.tenant_id} "
                    f"from tenant context {tenant_id}"
                )


# ============= Soft Delete Interception =============

@event.listens_for(Session, "before_flush")
def _convert_hard_delete_to_soft_delete(session: Session, flush_context, instances):
    """
    Convert DELETE operations to soft deletes for supported models.
    
    Instead of actually deleting the record, we set deleted_at = now().
    This allows data recovery and maintains referential integrity.
    """
    # Process objects marked for deletion
    for obj in list(session.deleted):
        model_name = obj.__class__.__name__
        
        # Check if model supports soft delete
        if _has_soft_delete(model_name) and hasattr(obj, "deleted_at"):
            # Remove from deleted set
            session.expunge(obj)
            
            # Add back to session and mark as dirty with deleted_at set
            session.add(obj)
            obj.deleted_at = datetime.utcnow()
            
            logger.debug(f"Converted hard delete to soft delete for {model_name} id={getattr(obj, 'id', 'unknown')}")


# ============= Context Manager Utilities =============

class TenantContextManager:
    """
    Context manager for temporarily setting tenant context.
    
    Usage:
        async with TenantContextManager(tenant_id="abc"):
            # All queries here will be scoped to tenant "abc"
            users = await session.execute(select(User))
    """
    
    def __init__(self, tenant_id: str | None = None, branch_id: str | None = None, bypass: bool = False):
        self.tenant_id = tenant_id
        self.branch_id = branch_id
        self.bypass = bypass
        self._tenant_token = None
        self._branch_token = None
        self._bypass_token = None
    
    def __enter__(self):
        if self.tenant_id:
            self._tenant_token = tenant_context.set(self.tenant_id)
        if self.branch_id:
            self._branch_token = branch_context.set(self.branch_id)
        if self.bypass:
            self._bypass_token = bypass_tenant_filter.set(True)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._tenant_token:
            tenant_context.reset(self._tenant_token)
        if self._branch_token:
            branch_context.reset(self._branch_token)
        if self._bypass_token:
            bypass_tenant_filter.reset(self._bypass_token)
        return False


class UnscopedContext:
    """
    Context manager to bypass tenant filtering.
    
    USE WITH EXTREME CAUTION - only for admin/seed operations.
    
    Usage:
        with UnscopedContext():
            # Queries here bypass tenant filtering
            all_users = await session.execute(select(User))
    """
    
    def __init__(self):
        self._token = None
    
    def __enter__(self):
        self._token = bypass_tenant_filter.set(True)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._token:
            bypass_tenant_filter.reset(self._token)
        return False


# ============= Initialization =============

def init_hooks():
    """
    Initialize all SQLAlchemy event hooks.
    
    Call this once during app startup after SQLAlchemy engine is created.
    The hooks are actually registered at module import time via decorators,
    so this function mainly serves as a documentation/verification point.
    """
    logger.info("SQLAlchemy tenant isolation hooks initialized")
    logger.info(f"  Global models (bypass tenant filter): {len(GLOBAL_MODELS)}")
    logger.info(f"  Soft delete models: {len(SOFT_DELETE_MODELS)}")
    logger.info(f"  Branch-scoped models: {len(BRANCH_SCOPED_MODELS)}")


# Export commonly used items
__all__ = [
    "tenant_context",
    "branch_context", 
    "user_context",
    "bypass_tenant_filter",
    "TenantContextManager",
    "UnscopedContext",
    "init_hooks",
    "GLOBAL_MODELS",
    "SOFT_DELETE_MODELS",
]
