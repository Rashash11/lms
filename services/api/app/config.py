"""
FastAPI Backend Configuration

Loads settings from environment variables with sensible defaults.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Database
    database_url: str
    
    # Redis (for rate limiting, caching, and Celery)
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT Configuration
    jwt_secret: str
    jwt_issuer: str = "lms-auth"
    jwt_audience: str = "lms-api"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    
    # Environment
    env: Literal["development", "production", "test"] = "development"
    debug: bool = False
    
    # Cookie settings
    cookie_secure: bool = False  # Set True in production
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_httponly: bool = True

    
    @property
    def is_production(self) -> bool:
        return self.env == "production"
    
    @property
    def access_token_expire_seconds(self) -> int:
        return self.access_token_minutes * 60
    
    @property
    def refresh_token_expire_seconds(self) -> int:
        return self.refresh_token_days * 24 * 60 * 60


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
