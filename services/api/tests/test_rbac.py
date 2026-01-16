"""
RBAC Unit Tests

Tests for permission aggregation, overrides, and caching.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestPermissionAggregation:
    """Tests for permission aggregation from roles."""
    
    @pytest.mark.asyncio
    async def test_aggregate_from_single_role(self):
        """Should aggregate permissions from a single role."""
        from app.rbac.service import get_user_permissions, clear_permission_cache
        
        clear_permission_cache()
        
        # Mock user with INSTRUCTOR role
        mock_user = MagicMock()
        mock_user.id = "user-1"
        mock_user.role = MagicMock(value="INSTRUCTOR")
        mock_user.roles = []
        mock_user.rbac_overrides = None
        
        # Mock DB
        mock_db = AsyncMock()
        
        # Mock user query
        user_result = MagicMock()
        user_result.scalar_one_or_none.return_value = mock_user
        
        # Mock permissions query
        perm_result = MagicMock()
        perm_result.scalars.return_value = ["course:read", "course:create"]
        
        mock_db.execute.side_effect = [user_result, perm_result]
        
        permissions = await get_user_permissions(mock_db, "user-1")
        
        assert "course:read" in permissions
        assert "course:create" in permissions
    
    @pytest.mark.asyncio
    async def test_aggregate_from_multiple_roles(self):
        """Should aggregate permissions from multiple roles."""
        from app.rbac.service import get_user_permissions, clear_permission_cache
        
        clear_permission_cache()
        
        # Mock user with multiple roles
        mock_role1 = MagicMock()
        mock_role1.role_key = MagicMock(value="INSTRUCTOR")
        
        mock_role2 = MagicMock()
        mock_role2.role_key = MagicMock(value="LEARNER")
        
        mock_user = MagicMock()
        mock_user.id = "user-1"
        mock_user.role = MagicMock(value="INSTRUCTOR")
        mock_user.roles = [mock_role1, mock_role2]
        mock_user.rbac_overrides = None
        
        mock_db = AsyncMock()
        
        user_result = MagicMock()
        user_result.scalar_one_or_none.return_value = mock_user
        
        perm_result = MagicMock()
        perm_result.scalars.return_value = ["course:read", "course:create", "enrollment:read"]
        
        mock_db.execute.side_effect = [user_result, perm_result]
        
        permissions = await get_user_permissions(mock_db, "user-1")
        
        assert len(permissions) >= 3


class TestRBACOverrides:
    """Tests for RBAC permission overrides."""
    
    @pytest.mark.asyncio
    async def test_grants_add_permissions(self):
        """Grants should add extra permissions."""
        from app.rbac.service import get_user_permissions, clear_permission_cache
        
        clear_permission_cache()
        
        mock_user = MagicMock()
        mock_user.id = "user-1"
        mock_user.role = MagicMock(value="LEARNER")
        mock_user.roles = []
        mock_user.rbac_overrides = {
            "grants": ["admin:special_access"],
            "denies": [],
        }
        
        mock_db = AsyncMock()
        
        user_result = MagicMock()
        user_result.scalar_one_or_none.return_value = mock_user
        
        perm_result = MagicMock()
        perm_result.scalars.return_value = ["course:read"]
        
        mock_db.execute.side_effect = [user_result, perm_result]
        
        permissions = await get_user_permissions(mock_db, "user-1")
        
        assert "course:read" in permissions
        assert "admin:special_access" in permissions
    
    @pytest.mark.asyncio
    async def test_denies_remove_permissions(self):
        """Denies should remove permissions."""
        from app.rbac.service import get_user_permissions, clear_permission_cache
        
        clear_permission_cache()
        
        mock_user = MagicMock()
        mock_user.id = "user-1"
        mock_user.role = MagicMock(value="INSTRUCTOR")
        mock_user.roles = []
        mock_user.rbac_overrides = {
            "grants": [],
            "denies": ["course:delete"],
        }
        
        mock_db = AsyncMock()
        
        user_result = MagicMock()
        user_result.scalar_one_or_none.return_value = mock_user
        
        perm_result = MagicMock()
        perm_result.scalars.return_value = ["course:read", "course:delete"]
        
        mock_db.execute.side_effect = [user_result, perm_result]
        
        permissions = await get_user_permissions(mock_db, "user-1")
        
        assert "course:read" in permissions
        assert "course:delete" not in permissions
    
    @pytest.mark.asyncio
    async def test_deny_takes_precedence_over_grant(self):
        """Denies should take precedence over grants."""
        from app.rbac.service import get_user_permissions, clear_permission_cache
        
        clear_permission_cache()
        
        mock_user = MagicMock()
        mock_user.id = "user-1"
        mock_user.role = MagicMock(value="LEARNER")
        mock_user.roles = []
        mock_user.rbac_overrides = {
            "grants": ["special:access"],
            "denies": ["special:access"],  # Same permission denied
        }
        
        mock_db = AsyncMock()
        
        user_result = MagicMock()
        user_result.scalar_one_or_none.return_value = mock_user
        
        perm_result = MagicMock()
        perm_result.scalars.return_value = []
        
        mock_db.execute.side_effect = [user_result, perm_result]
        
        permissions = await get_user_permissions(mock_db, "user-1")
        
        # Deny takes precedence - permission should NOT be present
        assert "special:access" not in permissions


class TestPermissionCaching:
    """Tests for permission caching."""
    
    @pytest.mark.asyncio
    async def test_cache_hit(self):
        """Should return cached permissions on second call."""
        from app.rbac.service import get_user_permissions, clear_permission_cache, _permission_cache
        
        clear_permission_cache()
        
        # Pre-populate cache
        _permission_cache["cached-user"] = {"cached:permission"}
        
        mock_db = AsyncMock()
        
        permissions = await get_user_permissions(mock_db, "cached-user")
        
        # Should return from cache, not call DB
        mock_db.execute.assert_not_called()
        assert "cached:permission" in permissions
    
    def test_cache_clear_single_user(self):
        """Should clear cache for a single user."""
        from app.rbac.service import clear_permission_cache, _permission_cache
        
        _permission_cache["user-1"] = {"perm:1"}
        _permission_cache["user-2"] = {"perm:2"}
        
        clear_permission_cache("user-1")
        
        assert "user-1" not in _permission_cache
        assert "user-2" in _permission_cache
    
    def test_cache_clear_all(self):
        """Should clear entire cache."""
        from app.rbac.service import clear_permission_cache, _permission_cache
        
        _permission_cache["user-1"] = {"perm:1"}
        _permission_cache["user-2"] = {"perm:2"}
        
        clear_permission_cache()
        
        assert len(_permission_cache) == 0


class TestCanFunction:
    """Tests for the can() permission check."""
    
    @pytest.mark.asyncio
    async def test_can_returns_true_with_permission(self):
        """Should return True when user has permission."""
        from app.rbac.service import can, clear_permission_cache, _permission_cache
        from app.auth.deps import AuthContext
        
        clear_permission_cache()
        _permission_cache["user-1"] = {"course:read", "course:create"}
        
        context = AuthContext(
            user_id="user-1",
            email="test@example.com",
            role="INSTRUCTOR",
        )
        
        mock_db = AsyncMock()
        
        result = await can(mock_db, context, "course:read")
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_can_returns_false_without_permission(self):
        """Should return False when user lacks permission."""
        from app.rbac.service import can, clear_permission_cache, _permission_cache
        from app.auth.deps import AuthContext
        
        clear_permission_cache()
        _permission_cache["user-1"] = {"course:read"}
        
        context = AuthContext(
            user_id="user-1",
            email="test@example.com",
            role="LEARNER",
        )
        
        mock_db = AsyncMock()
        
        result = await can(mock_db, context, "admin:delete_any")
        
        assert result is False


class TestRequirePermission:
    """Tests for require_permission dependency."""
    
    @pytest.mark.asyncio
    async def test_raises_on_missing_permission(self):
        """Should raise RBACError when permission is missing."""
        from app.rbac.service import require_permission, clear_permission_cache, _permission_cache
        from app.auth.deps import AuthContext
        from app.errors import RBACError
        
        clear_permission_cache()
        _permission_cache["user-1"] = set()
        
        context = AuthContext(
            user_id="user-1",
            email="test@example.com",
            role="LEARNER",
        )
        
        mock_db = AsyncMock()
        
        with pytest.raises(RBACError) as exc_info:
            await require_permission(mock_db, context, "admin:delete")
        
        assert "admin:delete" in str(exc_info.value)
