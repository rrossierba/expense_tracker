from datetime import date, datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, Field

from src.modules.categories.schemas import TagResponse
from src.modules.transactions.models import RecurrenceFrequency, TransactionType


class TransactionBase(BaseModel):
    account_id: uuid.UUID
    destination_account_id: uuid.UUID | None = Field(
        default=None,
        description="Required when type is TRANSFER",
    )
    category_id: uuid.UUID | None = None
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    exchange_rate: Decimal = Field(default=Decimal("1.000000"), gt=0)
    type: TransactionType = Field(default=TransactionType.EXPENSE)
    date: datetime
    payee: str | None = Field(default=None, max_length=150)
    description: str | None = None
    receipt_url: str | None = Field(default=None, max_length=500)
    is_cleared: bool = True


class TransactionCreate(TransactionBase):
    tag_ids: list[uuid.UUID] = []


class TransactionUpdate(BaseModel):
    account_id: uuid.UUID | None = None
    destination_account_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    exchange_rate: Decimal | None = Field(default=None, gt=0)
    type: TransactionType | None = None
    date: datetime | None = None
    payee: str | None = Field(default=None, max_length=150)
    description: str | None = None
    receipt_url: str | None = Field(default=None, max_length=500)
    is_cleared: bool | None = None
    tag_ids: list[uuid.UUID] | None = None


class TransactionResponse(TransactionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RecurringTransactionBase(BaseModel):
    account_id: uuid.UUID
    destination_account_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    type: TransactionType
    frequency: RecurrenceFrequency
    start_date: date
    next_execution_date: date
    end_date: date | None = None
    auto_create: bool = False


class RecurringTransactionCreate(RecurringTransactionBase):
    pass


class RecurringTransactionUpdate(BaseModel):
    account_id: uuid.UUID | None = None
    destination_account_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    type: TransactionType | None = None
    frequency: RecurrenceFrequency | None = None
    next_execution_date: date | None = None
    end_date: date | None = None
    auto_create: bool | None = None
    is_active: bool | None = None


class RecurringTransactionResponse(RecurringTransactionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

