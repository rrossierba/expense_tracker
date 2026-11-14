from datetime import datetime, timedelta, timezone
from typing import Any
import jwt
from pwdlib import PasswordHash

from src.core.config import settings

# Argon2id password hasher with modern secure defaults
password_hash = PasswordHash.recommended()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate secure Argon2id hash from plain password."""
    return password_hash.hash(password)


def create_jwt_token(
    subject: str,
    expires_delta: timedelta,
    token_type: str,
) -> str:
    """Create a signed JWT token with expiration and subject claims."""
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create an access token with short-lived expiration."""
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_jwt_token(subject=subject, expires_delta=delta, token_type="access")


def create_refresh_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a refresh token with long-lived expiration."""
    delta = expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_jwt_token(subject=subject, expires_delta=delta, token_type="refresh")


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate signature and expiration of a JWT token."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )

