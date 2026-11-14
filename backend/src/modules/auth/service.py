import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from src.core.exceptions import (
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
)
from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from src.modules.auth.models import User
from src.modules.auth.schemas import TokenResponse, UserCreate


class AuthService:
    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> User | None:
        stmt = select(User).where(User.email == email.lower())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def register_user(cls, db: AsyncSession, user_in: UserCreate) -> User:
        existing_user = await cls.get_by_email(db, user_in.email)
        if existing_user:
            raise ConflictException("An account with this email already exists")

        user = User(
            email=user_in.email.lower(),
            password_hash=get_password_hash(user_in.password),
            base_currency=user_in.base_currency.upper(),
            timezone=user_in.timezone,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @classmethod
    async def authenticate_user(
        cls, db: AsyncSession, email: str, password: str
    ) -> User:
        user = await cls.get_by_email(db, email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise ForbiddenException("Account is currently inactive")

        return user

    @staticmethod
    def create_tokens(user_id: uuid.UUID) -> TokenResponse:
        sub = str(user_id)
        return TokenResponse(
            access_token=create_access_token(subject=sub),
            refresh_token=create_refresh_token(subject=sub),
            token_type="bearer",
        )

    @classmethod
    async def refresh_token(
        cls, db: AsyncSession, refresh_token: str
    ) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except jwt.PyJWTError:
            raise UnauthorizedException("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type")

        user_id_raw = payload.get("sub")
        if not user_id_raw:
            raise UnauthorizedException("Missing token subject")

        try:
            user_id = uuid.UUID(user_id_raw)
        except ValueError:
            raise UnauthorizedException("Invalid user ID in token")

        user = await cls.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        return cls.create_tokens(user.id)


auth_service = AuthService()

