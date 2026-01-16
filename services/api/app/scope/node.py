"""
Node Scoping Helpers

Enforces multi-tenant branch/node isolation.
Matches the TypeScript implementation's behavior.
"""

from typing import TypeVar

from sqlalchemy import Select

from app.auth.deps import AuthContext
from app.errors import NodeScopeError


def is_tenant_global_admin(context: AuthContext) -> bool:
    """
    Check if user is a tenant-global admin.
    
    ADMIN role can access all nodes within their tenant.
    
    Args:
        context: Auth context from require_auth
    
    Returns:
        True if user is ADMIN role
    """
    return context.role == "ADMIN"


def require_node_scope(context: AuthContext) -> str | None:
    """
    Get the node ID from context, enforcing scope for non-ADMIN users.
    
    - ADMIN users can operate without node scope (tenant-global access)
    - Non-ADMIN users MUST have a nodeId
    
    Args:
        context: Auth context from require_auth
    
    Returns:
        nodeId if present, None if ADMIN without scope
    
    Raises:
        NodeScopeError: If non-ADMIN and no nodeId
    """
    if context.role == "ADMIN":
        # ADMIN is tenant-global: nodeId is optional
        return context.node_id
    
    if not context.node_id:
        raise NodeScopeError("Node scope required for this operation")
    
    return context.node_id


T = TypeVar("T")


def enforce_node_filter(
    query: Select[tuple[T]],
    model: type,
    node_field: str,
    context: AuthContext,
) -> Select[tuple[T]]:
    """
    Apply node scope filter to a SQLAlchemy query.
    
    - ADMIN without explicit nodeId = tenant-global (no filter)
    - ADMIN with nodeId = filter to that node
    - Non-ADMIN = filter to their assigned node
    
    Args:
        query: SQLAlchemy select query
        model: The model class being queried
        node_field: Field name for node filtering (e.g., "node_id")
        context: Auth context from require_auth
    
    Returns:
        Query with node filter applied
    
    Raises:
        NodeScopeError: If non-ADMIN without nodeId
    """
    # ADMIN without explicit nodeId = tenant-global (no node filter)
    if context.role == "ADMIN" and not context.node_id:
        return query
    
    # Non-ADMIN must have nodeId
    if not context.node_id and context.role != "ADMIN":
        raise NodeScopeError("Node scope required")
    
    # Apply node filter
    if context.node_id:
        node_column = getattr(model, node_field, None)
        if node_column is not None:
            return query.where(node_column == context.node_id)
    
    return query


def validate_node_access(
    context: AuthContext,
    resource_node_id: str | None,
) -> bool:
    """
    Validate that user can access a resource based on node.
    
    Args:
        context: Auth context
        resource_node_id: Node ID of the resource
    
    Returns:
        True if access allowed, False otherwise
    """
    # ADMIN can access any node within tenant
    if context.role == "ADMIN":
        return True
    
    # Non-admin must be scoped to same node
    if not context.node_id:
        return False
    
    # Resource with no node is accessible
    if not resource_node_id:
        return True
    
    return context.node_id == resource_node_id
