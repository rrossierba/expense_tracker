from typing import Sequence
import uuid
from fastapi import APIRouter, Query, status

from src.core.dependencies import CurrentUser, DBSession
from src.modules.accounts.schemas import (
    AccountCreate,
    AccountResponse,
    AccountUpdate,
)
from src.modules.accounts.service import account_service

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new financial account",
)
async def create_account(
    account_in: AccountCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> AccountResponse:
    """Create a new financial account belonging to the authenticated user."""
    account = await account_service.create_account(
        db=db,
        user_id=current_user.id,
        account_in=account_in,
    )
    return await account_service.build_response(db, account)


@router.get(
    "",
    response_model=list[AccountResponse],
    summary="List all financial accounts of current user",
)
async def list_accounts(
    current_user: CurrentUser,
    db: DBSession,
    include_archived: bool = Query(
        default=False,
        description="Whether to include soft-archived accounts",
    ),
) -> Sequence[AccountResponse]:
    """Retrieve all accounts owned by the authenticated user."""
    account_response = await account_service.get_user_accounts(
        db=db,
        user_id=current_user.id,
        include_archived=include_archived,
    )
    return await account_service.build_responses(db, account_response)


@router.get(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Get financial account by ID",
)
async def get_account(
    account_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> AccountResponse:
    """Retrieve a single account by ID with IDOR protection."""
    account_response = await account_service.get_account_by_id(
        db=db,
        account_id=account_id,
        user_id=current_user.id,
    )
    return await account_service.build_response(db, account_response)


@router.patch(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Update financial account",
)
async def update_account(
    account_id: uuid.UUID,
    account_in: AccountUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> AccountResponse:
    """Partially update account details (name, color, icon, archive status)."""
    account_response = await account_service.update_account(
        db=db,
        account_id=account_id,
        user_id=current_user.id,
        account_in=account_in,
    )
    return await account_service.build_response(db, account_response)


@router.delete(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Soft-archive financial account",
)
async def delete_account(
    account_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> AccountResponse:
    """Soft-archive account to keep historical transactions intact."""
    account_response = await account_service.archive_account(
        db=db,
        account_id=account_id,
        user_id=current_user.id,
    )
    return await account_service.build_response(db, account_response)

