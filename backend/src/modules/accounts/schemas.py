from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, Field

from src.modules.accounts.models import AccountType


class AccountBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User-friendly name of the financial account",
    )
    type: AccountType = Field(
        default=AccountType.CHECKING,
        description="Type of financial account (CHECKING, SAVINGS, CREDIT_CARD, CASH, INVESTMENT)",
    )
    currency: str = Field(
        default="EUR",
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code (e.g. EUR, USD)",
    )
    color: str | None = Field(
        default=None,
        max_length=30,
        description="Hex code or color string for UI representation",
    )
    icon: str | None = Field(
        default=None,
        max_length=50,
        description="Icon identifier for UI representation",
    )


class AccountCreate(AccountBase):
    initial_balance: Decimal = Field(
        default=Decimal("0.00"),
        decimal_places=2,
        description="Starting balance when account is initialized",
    )


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    type: AccountType | None = None
    color: str | None = None
    icon: str | None = None
    is_archived: bool | None = None


class AccountResponse(AccountBase):
    id: uuid.UUID
    user_id: uuid.UUID
    initial_balance: Decimal
    current_balance: Decimal = Decimal("0.00")
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

