from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, Field

from src.modules.budgets.models import BudgetPeriod


class BudgetBase(BaseModel):
    category_id: uuid.UUID | None = Field(
        default=None,
        description="Target category (NULL means global budget for all expenses)",
    )
    amount_limit: Decimal = Field(..., gt=0, decimal_places=2)
    period: BudgetPeriod = Field(default=BudgetPeriod.MONTHLY)
    notify_threshold: int = Field(
        default=80,
        ge=1,
        le=100,
        description="Percentage of budget used at which to trigger a warning (1-100)",
    )


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount_limit: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    period: BudgetPeriod | None = None
    notify_threshold: int | None = Field(default=None, ge=1, le=100)


class BudgetResponse(BudgetBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    # Computed at response time by service
    spent_amount: Decimal = Decimal("0.00")
    remaining_amount: Decimal = Decimal("0.00")
    usage_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class SavingsGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    target_amount: Decimal = Field(..., gt=0, decimal_places=2)
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=30)


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    target_amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    icon: str | None = None
    color: str | None = None
    is_completed: bool | None = None


class SavingsGoalDepositWithdraw(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)


class SavingsGoalResponse(SavingsGoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    current_amount: Decimal
    is_completed: bool
    progress_percentage: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

