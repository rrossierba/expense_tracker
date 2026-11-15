from src.core.config import Settings


def test_database_url_uses_explicit_url() -> None:
    settings = Settings(
        _env_file=None,
        DATABASE_URL="postgresql+asyncpg://user:password@db:5432/test_db",
    )

    assert settings.ASYNC_DATABASE_URL == (
        "postgresql+asyncpg://user:password@db:5432/test_db"
    )


def test_database_url_is_built_from_postgres_settings() -> None:
    settings = Settings(
        _env_file=None,
        POSTGRES_USER="test_user",
        POSTGRES_PASSWORD="test_password",
        POSTGRES_SERVER="test_db",
        POSTGRES_PORT=5433,
        POSTGRES_DB="test_database",
    )

    assert settings.ASYNC_DATABASE_URL == (
        "postgresql+asyncpg://test_user:test_password@test_db:5433/test_database"
    )
