from datetime import datetime, timezone
from decimal import Decimal
import uuid
from pydantic import BaseModel, Field


class MonthlyTrend(BaseModel):
    year: int
    month: int
    total_income: Decimal = Decimal("0.00")
    total_expense: Decimal = Decimal("0.00")
    net: Decimal = Decimal("0.00")


class CategoryBreakdown(BaseModel):
    category_id: uuid.UUID | None
    category_name: str
    total: Decimal
    percentage: float


class AccountBalance(BaseModel):
    account_id: uuid.UUID
    account_name: str
    currency: str
    initial_balance: Decimal
    current_balance: Decimal


class DashboardSummaryResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    total_income: Decimal = Decimal("0.00")
    total_expense: Decimal = Decimal("0.00")
    net_balance: Decimal = Decimal("0.00")
    net_worth: Decimal = Decimal("0.00")
    account_balances: list[AccountBalance] = []


class CategoryBreakdownResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    total_expense: Decimal = Decimal("0.00")
    breakdown: list[CategoryBreakdown] = []


class MonthlyTrendResponse(BaseModel):
    months: int = Field(description="Number of months included in the trend")
    data: list[MonthlyTrend] = []

