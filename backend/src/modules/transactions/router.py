from datetime import datetime
from typing import Sequence
import uuid
from fastapi import APIRouter, Query, status

from src.core.dependencies import CurrentUser, DBSession
from src.modules.transactions.models import TransactionType
from src.modules.transactions.schemas import (
    RecurringTransactionCreate,
    RecurringTransactionResponse,
    RecurringTransactionUpdate,
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from src.modules.transactions.service import (
    recurring_service,
    transaction_service,
)

router = APIRouter(tags=["Transactions & Subscriptions"])


# ------------------------------------------------------------------------------
# Transactions Endpoints
# ------------------------------------------------------------------------------
@router.post(
    "/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a transaction (income, expense, or transfer)",
)
async def create_transaction(
    tx_in: TransactionCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> TransactionResponse:
    return await transaction_service.create_transaction(
        db=db,
        user_id=current_user.id,
        tx_in=tx_in,
    )


@router.get(
    "/transactions",
    response_model=list[TransactionResponse],
    summary="List transactions with filters and pagination",
)
async def list_transactions(
    current_user: CurrentUser,
    db: DBSession,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    account_id: uuid.UUID | None = Query(default=None),
    category_id: uuid.UUID | None = Query(default=None),
    tx_type: TransactionType | None = Query(default=None),
    search: str | None = Query(
        default=None, description="Search by payee or description"
    ),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Sequence[TransactionResponse]:
    return await transaction_service.get_transactions(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        category_id=category_id,
        tx_type=tx_type,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/transactions/{tx_id}",
    response_model=TransactionResponse,
    summary="Get single transaction details",
)
async def get_transaction(
    tx_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> TransactionResponse:
    return await transaction_service.get_transaction_by_id(
        db=db,
        tx_id=tx_id,
        user_id=current_user.id,
    )


@router.patch(
    "/transactions/{tx_id}",
    response_model=TransactionResponse,
    summary="Update transaction",
)
async def update_transaction(
    tx_id: uuid.UUID,
    tx_in: TransactionUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> TransactionResponse:
    return await transaction_service.update_transaction(
        db=db,
        tx_id=tx_id,
        user_id=current_user.id,
        tx_in=tx_in,
    )


@router.delete(
    "/transactions/{tx_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete transaction",
)
async def delete_transaction(
    tx_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    await transaction_service.delete_transaction(
        db=db,
        tx_id=tx_id,
        user_id=current_user.id,
    )


# ------------------------------------------------------------------------------
# Recurring Transactions Endpoints
# ------------------------------------------------------------------------------
@router.post(
    "/recurring-transactions",
    response_model=RecurringTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a recurring transaction or subscription",
)
async def create_recurring_transaction(
    recurring_in: RecurringTransactionCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> RecurringTransactionResponse:
    return await recurring_service.create_recurring(
        db=db,
        user_id=current_user.id,
        recurring_in=recurring_in,
    )


@router.get(
    "/recurring-transactions",
    response_model=list[RecurringTransactionResponse],
    summary="List recurring transactions of user",
)
async def list_recurring_transactions(
    current_user: CurrentUser,
    db: DBSession,
) -> Sequence[RecurringTransactionResponse]:
    return await recurring_service.get_user_recurring(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/recurring-transactions/{recurring_id}",
    response_model=RecurringTransactionResponse,
    summary="Get recurring transaction details",
)
async def get_recurring_transaction(
    recurring_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> RecurringTransactionResponse:
    return await recurring_service.get_by_id(
        db=db,
        recurring_id=recurring_id,
        user_id=current_user.id,
    )


@router.patch(
    "/recurring-transactions/{recurring_id}",
    response_model=RecurringTransactionResponse,
    summary="Update recurring transaction",
)
async def update_recurring_transaction(
    recurring_id: uuid.UUID,
    update_in: RecurringTransactionUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> RecurringTransactionResponse:
    return await recurring_service.update_recurring(
        db=db,
        recurring_id=recurring_id,
        user_id=current_user.id,
        update_in=update_in,
    )


@router.delete(
    "/recurring-transactions/{recurring_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete recurring transaction",
)
async def delete_recurring_transaction(
    recurring_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    await recurring_service.delete_recurring(
        db=db,
        recurring_id=recurring_id,
        user_id=current_user.id,
    )

