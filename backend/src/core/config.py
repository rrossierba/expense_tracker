from functools import lru_cache
from typing import Literal
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration of the application loaded from environment variables or .env file.
    """

    # 1. General Application Info
    PROJECT_NAME: str = Field(
        default="Expense Tracker API",
        description="Name of the application",
    )
    VERSION: str = Field(
        default="0.1.0",
        description="Application semantic version",
    )
    API_V1_PREFIX: str = Field(
        default="/api/v1",
        description="Prefix for API version 1 routes",
    )
    ENVIRONMENT: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Current deployment environment",
    )
    DEBUG: bool = Field(
        default=True,
        description="Enable debug mode and detailed error traces",
    )

    # 2. CORS (Cross-Origin Resource Sharing)
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        description="Allowed origins for CORS requests (e.g. Next.js frontend)",
    )

    # 3. Database PostgreSQL
    POSTGRES_SERVER: str = Field(
        default="localhost",
        description="PostgreSQL server hostname",
    )
    POSTGRES_PORT: int = Field(
        default=5432,
        ge=1,
        le=65535,
        description="PostgreSQL port number",
    )
    POSTGRES_USER: str = Field(
        default="postgres",
        description="PostgreSQL database user",
    )
    POSTGRES_PASSWORD: str = Field(
        default="postgres",
        description="PostgreSQL database password",
    )
    POSTGRES_DB: str = Field(
        default="expense_tracker",
        description="PostgreSQL database name",
    )
    DATABASE_URL: str | None = Field(
        default=None,
        description="Full connection URL (overrides individual postgres settings if set)",
    )

    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """
        Calculates connection URL for SQLAlchemy with asyncpg driver.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # 4. Security & JWT
    SECRET_KEY: str = Field(
        default="6181564646995860cef7a7254d221a12d100906efcdd25e39d6c744f10d8a927",
        min_length=32,
        description="Cryptographic secret key for signing JWT tokens",
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="JWT cryptographic signing algorithm",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60,
        gt=0,
        description="Expiration time in minutes for access tokens",
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        gt=0,
        description="Expiration time in days for refresh tokens",
    )

    # 5. AI API Keys (Optional for initial setup)
    OPENAI_API_KEY: str | None = Field(
        default=None,
        description="API key for OpenAI services",
    )
    GEMINI_API_KEY: str | None = Field(
        default=None,
        description="API key for Google Gemini services",
    )

    # Settings Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Returns cached singleton instance of Settings.
    Supports overrides in tests via dependency injection.
    """
    return Settings()


settings = get_settings()