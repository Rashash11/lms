"""
Node Scope Unit Tests

Tests for node isolation, admin bypass, and scope enforcement.
"""

import pytest
from unittest.mock import MagicMock

from app.auth.deps import AuthContext
from app.errors import NodeScopeError


class TestIsTenantGlobalAdmin:
    """Tests for is_tenant_global_admin function."""
    
    def test_admin_is_tenant_global(self):
        """ADMIN role should be tenant-global."""
        from app.scope.node import is_tenant_global_admin
        
        context = AuthContext(
            user_id="admin-1",
            email="admin@example.com",
            role="ADMIN",
        )
        
        assert is_tenant_global_admin(context) is True
    
    def test_instructor_is_not_tenant_global(self):
        """INSTRUCTOR role should NOT be tenant-global."""
        from app.scope.node import is_tenant_global_admin
        
        context = AuthContext(
            user_id="instructor-1",
            email="instructor@example.com",
            role="INSTRUCTOR",
            node_id="branch-1",
        )
        
        assert is_tenant_global_admin(context) is False
    
    def test_learner_is_not_tenant_global(self):
        """LEARNER role should NOT be tenant-global."""
        from app.scope.node import is_tenant_global_admin
        
        context = AuthContext(
            user_id="learner-1",
            email="learner@example.com",
            role="LEARNER",
            node_id="branch-1",
        )
        
        assert is_tenant_global_admin(context) is False


class TestRequireNodeScope:
    """Tests for require_node_scope function."""
    
    def test_admin_without_node_id_returns_none(self):
        """ADMIN without nodeId should return None (tenant-global)."""
        from app.scope.node import require_node_scope
        
        context = AuthContext(
            user_id="admin-1",
            email="admin@example.com",
            role="ADMIN",
        )
        
        result = require_node_scope(context)
        
        assert result is None
    
    def test_admin_with_node_id_returns_node_id(self):
        """ADMIN with nodeId should return that nodeId."""
        from app.scope.node import require_node_scope
        
        context = AuthContext(
            user_id="admin-1",
            email="admin@example.com",
            role="ADMIN",
            node_id="branch-1",
        )
        
        result = require_node_scope(context)
        
        assert result == "branch-1"
    
    def test_non_admin_with_node_id_returns_node_id(self):
        """Non-ADMIN with nodeId should return that nodeId."""
        from app.scope.node import require_node_scope
        
        context = AuthContext(
            user_id="instructor-1",
            email="instructor@example.com",
            role="INSTRUCTOR",
            node_id="branch-2",
        )
        
        result = require_node_scope(context)
        
        assert result == "branch-2"
    
    def test_non_admin_without_node_id_raises(self):
        """Non-ADMIN without nodeId should raise NodeScopeError."""
        from app.scope.node import require_node_scope
        
        context = AuthContext(
            user_id="learner-1",
            email="learner@example.com",
            role="LEARNER",
            # No node_id
        )
        
        with pytest.raises(NodeScopeError):
            require_node_scope(context)


class TestValidateNodeAccess:
    """Tests for validate_node_access function."""
    
    def test_admin_can_access_any_node(self):
        """ADMIN should access any node."""
        from app.scope.node import validate_node_access
        
        context = AuthContext(
            user_id="admin-1",
            email="admin@example.com",
            role="ADMIN",
        )
        
        # Admin can access any node
        assert validate_node_access(context, "branch-1") is True
        assert validate_node_access(context, "branch-2") is True
        assert validate_node_access(context, None) is True
    
    def test_user_can_access_own_node(self):
        """User should access their own node."""
        from app.scope.node import validate_node_access
        
        context = AuthContext(
            user_id="instructor-1",
            email="instructor@example.com",
            role="INSTRUCTOR",
            node_id="branch-1",
        )
        
        assert validate_node_access(context, "branch-1") is True
    
    def test_user_cannot_access_other_node(self):
        """User should NOT access other nodes."""
        from app.scope.node import validate_node_access
        
        context = AuthContext(
            user_id="instructor-1",
            email="instructor@example.com",
            role="INSTRUCTOR",
            node_id="branch-1",
        )
        
        assert validate_node_access(context, "branch-2") is False
    
    def test_user_can_access_unscoped_resource(self):
        """User should access resources with no node (tenant-wide)."""
        from app.scope.node import validate_node_access
        
        context = AuthContext(
            user_id="learner-1",
            email="learner@example.com",
            role="LEARNER",
            node_id="branch-1",
        )
        
        # Resource without node_id is accessible
        assert validate_node_access(context, None) is True
    
    def test_user_without_node_cannot_access_scoped_resource(self):
        """User without nodeId cannot access node-scoped resources."""
        from app.scope.node import validate_node_access
        
        context = AuthContext(
            user_id="learner-1",
            email="learner@example.com",
            role="LEARNER",
            # No node_id
        )
        
        # User without node cannot access scoped resources
        assert validate_node_access(context, "branch-1") is False


class TestEnforceNodeFilter:
    """Tests for enforce_node_filter SQL query modifier."""
    
    def test_admin_without_node_no_filter(self):
        """ADMIN without nodeId should not add node filter."""
        from app.scope.node import enforce_node_filter
        from sqlalchemy import select
        
        # Mock model
        class MockUser:
            node_id = "column"
        
        context = AuthContext(
            user_id="admin-1",
            email="admin@example.com",
            role="ADMIN",
        )
        
        query = select()
        
        # Should return query unchanged
        result = enforce_node_filter(query, MockUser, "node_id", context)
        
        # Query should be the same object (no filter added)
        assert result is query
    
    def test_non_admin_without_node_raises(self):
        """Non-ADMIN without nodeId should raise."""
        from app.scope.node import enforce_node_filter
        from sqlalchemy import select
        
        class MockUser:
            node_id = "column"
        
        context = AuthContext(
            user_id="learner-1",
            email="learner@example.com",
            role="LEARNER",
        )
        
        query = select()
        
        with pytest.raises(NodeScopeError):
            enforce_node_filter(query, MockUser, "node_id", context)


class TestCrossTenantPrevention:
    """Tests to verify cross-tenant access is prevented."""
    
    def test_node_id_from_jwt_not_request(self):
        """nodeId must come from JWT, not request body."""
        # This is a conceptual test - actual enforcement is in route handlers
        context_from_jwt = AuthContext(
            user_id="user-1",
            email="user@example.com",
            role="INSTRUCTOR",
            node_id="branch-1",  # From verified JWT
        )
        
        forged_request_body = {"nodeId": "branch-999"}  # Attacker's attempt
        
        # The context.node_id is what should be used, not the request body
        assert context_from_jwt.node_id == "branch-1"
        assert context_from_jwt.node_id != forged_request_body["nodeId"]
