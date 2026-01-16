"""
Password Hashing

Uses bcrypt via passlib for secure password hashing.
Compatible with existing bcrypt hashes from the TypeScript backend.
"""

from passlib.context import CryptContext

# Configure passlib with bcrypt
# The schemes list allows for future algorithm migrations
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=10,  # Match TS backend's bcrypt.hash(password, 10)
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
    
    Returns:
        Bcrypt hash string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a bcrypt hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Bcrypt hash from database
    
    Returns:
        True if password matches, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Handle malformed hashes gracefully
        return False


def validate_password_policy(password: str) -> tuple[bool, str | None]:
    """
    Validate password meets security requirements.
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one number
    
    Args:
        password: Password to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    return True, None
