"""
RBAC Permission Service

DB-backed permission resolution with caching.
Matches the TypeScript implementation's behavior.
"""

from cachetools import TTLCache
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import AuthContext
from app.db.models import AuthPermission, AuthRole, AuthRolePermission, User, UserRole
from app.errors import AuthError, RBACError

# Permission cache: user_id -> set of permissions
# TTL of 60 seconds matches TypeScript implementation
_permission_cache: TTLCache[str, set[str]] = TTLCache(maxsize=1000, ttl=60)


async def get_user_permissions(
    db: AsyncSession,
    user_id: str,
    node_id: str | None = None,
) -> set[str]:
    """
    Get all permissions for a user by aggregating from roles + overrides.
    
    Resolution order:
    1. Get user's role keys from users.activeRole + user_roles table
    2. Map role keys to auth_role entries
    3. Get permissions via auth_role_permission -> auth_permission
    4. Apply rbacOverrides (grants then denies)
    
    Args:
        db: Database session
        user_id: User's UUID
        node_id: Optional node ID (currently unused in caching key)
    
    Returns:
        Set of permission strings (e.g., "course:create")
    """
    # Check cache first
    cache_key = user_id
    if cache_key in _permission_cache:
        return _permission_cache[cache_key]
    
    # Fetch user with roles
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise AuthError("User not found", status_code=404)
    
    # Collect all role keys
    role_keys: set[str] = set()
    
    # Primary role from users.activeRole
    if user.role:
        role_keys.add(user.role.value if hasattr(user.role, 'value') else str(user.role))
    
    # Additional roles from user_roles
    for user_role in user.roles:
        role_key = user_role.role_key
        role_keys.add(role_key.value if hasattr(role_key, 'value') else str(role_key))
    
    # Get permissions from DB via role names
    permissions: set[str] = set()
    
    if role_keys:
        # Query auth_role -> auth_role_permission -> auth_permission
        perm_result = await db.execute(
            select(AuthPermission.full_permission)
            .join(AuthRolePermission, AuthRolePermission.permission_id == AuthPermission.id)
            .join(AuthRole, AuthRole.id == AuthRolePermission.role_id)
            .where(AuthRole.name.in_(role_keys))
        )
        for row in perm_result.scalars():
            permissions.add(row)
    
    # Apply overrides from users.rbac_overrides
    if user.rbac_overrides:
        overrides = user.rbac_overrides
        
        # Apply grants first
        grants = overrides.get("grants", [])
        if isinstance(grants, list):
            for perm in grants:
                permissions.add(perm)
        
        # Apply denies (takes precedence)
        denies = overrides.get("denies", [])
        if isinstance(denies, list):
            for perm in denies:
                permissions.discard(perm)
    
    # Update cache
    _permission_cache[cache_key] = permissions
    
    return permissions


async def can(
    db: AsyncSession,
    context: AuthContext,
    permission: str,
) -> bool:
    """
    Check if user has a specific permission.
    
    Args:
        db: Database session
        context: Auth context from require_auth
        permission: Permission string to check (e.g., "course:create")
    
    Returns:
        True if user has permission, False otherwise
    """
    permissions = await get_user_permissions(db, context.user_id, context.node_id)
    return permission in permissions


async def require_permission(
    db: AsyncSession,
    context: AuthContext,
    permission: str,
) -> None:
    """
    Require a specific permission - raises 403 if missing.
    
    Args:
        db: Database session
        context: Auth context from require_auth
        permission: Permission string required
    
    Raises:
        RBACError: If permission is missing
    """
    has_permission = await can(db, context, permission)
    if not has_permission:
        raise RBACError(permission)


def clear_permission_cache(user_id: str | None = None) -> None:
    """
    Clear the permission cache.
    
    Args:
        user_id: If provided, clear only this user's cache. Otherwise clear all.
    """
    if user_id:
        _permission_cache.pop(user_id, None)
    else:
        _permission_cache.clear()


async def get_all_permissions_for_role(db: AsyncSession, role_name: str) -> list[str]:
    """
    Get all permissions assigned to a role.
    
    Args:
        db: Database session
        role_name: Role name (e.g., "ADMIN", "INSTRUCTOR")
    
    Returns:
        List of permission strings
    """
    result = await db.execute(
        select(AuthPermission.full_permission)
        .join(AuthRolePermission, AuthRolePermission.permission_id == AuthPermission.id)
        .join(AuthRole, AuthRole.id == AuthRolePermission.role_id)
        .where(AuthRole.name == role_name)
    )
    return list(result.scalars())
