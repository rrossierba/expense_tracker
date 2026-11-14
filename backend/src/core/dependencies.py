import uuid
from typing import Annotated
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.core.exceptions import ForbiddenException, UnauthorizedException
from src.core.security import decode_token
from src.modules.auth.models import User
from src.modules.auth.service import auth_service

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login"
)

DBSession = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


async def get_current_user(token: TokenDep, db: DBSession) -> User:
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise UnauthorizedException("Could not validate credentials")

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        raise UnauthorizedException("Token missing subject")

    try:
        user_id = uuid.UUID(user_id_raw)
    except ValueError:
        raise UnauthorizedException("Invalid user ID in token")

    user = await auth_service.get_by_id(db, user_id)
    if not user:
        raise UnauthorizedException("User not found")

    if not user.is_active:
        raise ForbiddenException("Account is inactive")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

__all__ = ["get_db", "DBSession", "get_current_user", "CurrentUser"]
