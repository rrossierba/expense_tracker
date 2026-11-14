from fastapi import APIRouter, status

from src.core.dependencies import CurrentUser, DBSession
from src.modules.auth.schemas import (
    TokenRefreshRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from src.modules.auth.service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    user_in: UserCreate,
    db: DBSession,
) -> UserResponse:
    """Register a new user with email, password and base financial preferences."""
    user = await auth_service.register_user(db=db, user_in=user_in)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT tokens",
)
async def login(
    credentials: UserLogin,
    db: DBSession,
) -> TokenResponse:
    """Authenticate with email and password to receive access and refresh tokens."""
    user = await auth_service.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password,
    )
    return auth_service.create_tokens(user_id=user.id)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(
    payload: TokenRefreshRequest,
    db: DBSession,
) -> TokenResponse:
    """Provide a valid refresh token to obtain a new pair of tokens."""
    return await auth_service.refresh_token(
        db=db,
        refresh_token=payload.refresh_token,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
async def get_current_user_profile(
    current_user: CurrentUser,
) -> UserResponse:
    """Retrieve profile data for currently authenticated user."""
    return UserResponse.model_validate(current_user)

