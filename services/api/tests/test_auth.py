"""
Auth Unit Tests

Tests for JWT signing/verification, tokenVersion revocation, and password handling.
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
import os

# Set test environment variables BEFORE importing modules
os.environ["JWT_SECRET"] = "test-secret-key-for-testing"
os.environ["JWT_ISSUER"] = "lms-auth"
os.environ["JWT_AUDIENCE"] = "lms-api"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost/test"

from jose import jwt

# Test configuration
TEST_SECRET = "test-secret-key-for-testing"
TEST_ISSUER = "lms-auth"
TEST_AUDIENCE = "lms-api"


class TestJWTSigning:
    """Tests for JWT token signing."""
    
    def test_create_valid_token(self):
        """Should create a valid JWT with correct claims."""
        from app.auth.jwt import create_access_token
        
        token = create_access_token(
            user_id="test-user-id",
            email="test@example.com",
            role="LEARNER",
            node_id="branch-1",
            token_version=0,
        )
        
        # Decode and verify claims
        payload = jwt.decode(
            token,
            TEST_SECRET,
            algorithms=["HS256"],
            audience=TEST_AUDIENCE,
            issuer=TEST_ISSUER,
        )
        
        assert payload["userId"] == "test-user-id"
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "LEARNER"
        assert payload["nodeId"] == "branch-1"
        assert payload["tokenVersion"] == 0
        assert payload["iss"] == TEST_ISSUER
        assert payload["aud"] == TEST_AUDIENCE
        assert "exp" in payload
        assert "iat" in payload
    
    def test_token_without_node_id(self):
        """Should create token without nodeId for admin users."""
        from app.auth.jwt import create_access_token
        
        token = create_access_token(
            user_id="admin-id",
            email="admin@example.com",
            role="ADMIN",
            token_version=1,
        )
        
        payload = jwt.decode(
            token,
            TEST_SECRET,
            algorithms=["HS256"],
            audience=TEST_AUDIENCE,
            issuer=TEST_ISSUER,
        )
        
        assert "nodeId" not in payload
        assert payload["role"] == "ADMIN"


class TestJWTVerification:
    """Tests for JWT token verification."""
    
    def test_verify_valid_token(self):
        """Should verify a valid token."""
        from app.auth.jwt import create_access_token, verify_token_light
        
        token = create_access_token(
            user_id="test-id",
            email="test@example.com",
            role="LEARNER",
        )
        
        payload = verify_token_light(token)
        
        assert payload["userId"] == "test-id"
        assert payload["email"] == "test@example.com"
    
    def test_reject_expired_token(self):
        """Should reject expired tokens."""
        from app.auth.jwt import verify_token_light
        from app.errors import AuthError
        
        # Create an expired token
        now = datetime.now(timezone.utc)
        expired_token = jwt.encode(
            {
                "userId": "test-id",
                "email": "test@example.com",
                "role": "LEARNER",
                "iat": int((now - timedelta(hours=1)).timestamp()),
                "exp": int((now - timedelta(minutes=1)).timestamp()),
                "iss": TEST_ISSUER,
                "aud": TEST_AUDIENCE,
            },
            TEST_SECRET,
            algorithm="HS256",
        )
        
        with pytest.raises(AuthError) as exc_info:
            verify_token_light(expired_token)
        
        assert "Invalid or expired token" in str(exc_info.value)
    
    def test_reject_wrong_issuer(self):
        """Should reject tokens with wrong issuer."""
        from app.auth.jwt import verify_token_light
        from app.errors import AuthError
        
        now = datetime.now(timezone.utc)
        wrong_issuer_token = jwt.encode(
            {
                "userId": "test-id",
                "email": "test@example.com",
                "role": "LEARNER",
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(hours=1)).timestamp()),
                "iss": "wrong-issuer",
                "aud": TEST_AUDIENCE,
            },
            TEST_SECRET,
            algorithm="HS256",
        )
        
        with pytest.raises(AuthError):
            verify_token_light(wrong_issuer_token)
    
    def test_reject_wrong_audience(self):
        """Should reject tokens with wrong audience."""
        from app.auth.jwt import verify_token_light
        from app.errors import AuthError
        
        now = datetime.now(timezone.utc)
        wrong_audience_token = jwt.encode(
            {
                "userId": "test-id",
                "email": "test@example.com",
                "role": "LEARNER",
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(hours=1)).timestamp()),
                "iss": TEST_ISSUER,
                "aud": "wrong-audience",
            },
            TEST_SECRET,
            algorithm="HS256",
        )
        
        with pytest.raises(AuthError):
            verify_token_light(wrong_audience_token)
    
    def test_reject_invalid_signature(self):
        """Should reject tokens with invalid signature."""
        from app.auth.jwt import verify_token_light
        from app.errors import AuthError
        
        now = datetime.now(timezone.utc)
        token_with_wrong_key = jwt.encode(
            {
                "userId": "test-id",
                "email": "test@example.com",
                "role": "LEARNER",
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(hours=1)).timestamp()),
                "iss": TEST_ISSUER,
                "aud": TEST_AUDIENCE,
            },
            "wrong-secret-key",
            algorithm="HS256",
        )
        
        with pytest.raises(AuthError):
            verify_token_light(token_with_wrong_key)


class TestTokenVersionRevocation:
    """Tests for tokenVersion-based session revocation."""
    
    @pytest.mark.asyncio
    async def test_reject_revoked_token(self):
        """Should reject token when tokenVersion mismatches DB."""
        from app.auth.jwt import create_access_token, verify_token
        from app.errors import AuthError
        
        # Create token with version 0
        token = create_access_token(
            user_id="test-id",
            email="test@example.com",
            role="LEARNER",
            token_version=0,
        )
        
        # Mock DB to return version 1 (user did logout-all)
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = 1  # DB has version 1
        mock_db.execute.return_value = mock_result
        
        with pytest.raises(AuthError) as exc_info:
            await verify_token(token, mock_db)
        
        assert "revoked" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_accept_matching_token_version(self):
        """Should accept token when tokenVersion matches DB."""
        from app.auth.jwt import create_access_token, verify_token
        
        # Create token with version 1
        token = create_access_token(
            user_id="test-id",
            email="test@example.com",
            role="LEARNER",
            token_version=1,
        )
        
        # Mock DB to return matching version
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = 1
        mock_db.execute.return_value = mock_result
        
        payload = await verify_token(token, mock_db)
        
        assert payload["userId"] == "test-id"


class TestPasswordHashing:
    """Tests for password hashing."""
    
    def test_hash_and_verify(self):
        """Should hash and verify passwords correctly."""
        from app.auth.password import hash_password, verify_password
        
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        # Should not be plaintext
        assert hashed != password
        
        # Should verify correctly
        assert verify_password(password, hashed) is True
        assert verify_password("wrong-password", hashed) is False
    
    def test_password_policy_validation(self):
        """Should validate password policy correctly."""
        from app.auth.password import validate_password_policy
        
        # Too short
        valid, error = validate_password_policy("Short1")
        assert valid is False
        assert "8 characters" in error
        
        # No uppercase
        valid, error = validate_password_policy("lowercase123")
        assert valid is False
        assert "uppercase" in error
        
        # No number
        valid, error = validate_password_policy("NoNumbers!")
        assert valid is False
        assert "number" in error
        
        # Valid password
        valid, error = validate_password_policy("ValidPass123")
        assert valid is True
        assert error is None
