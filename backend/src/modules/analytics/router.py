from datetime import datetime
from fastapi import APIRouter, Query

from src.core.dependencies import CurrentUser, DBSession
from src.modules.analytics.schemas import (
    CategoryBreakdownResponse,
    DashboardSummaryResponse,
    MonthlyTrendResponse,
)
from src.modules.analytics.service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Dashboard summary: income, expenses, net balance and net worth",
)
async def get_dashboard_summary(
    current_user: CurrentUser,
    db: DBSession,
    start_date: datetime | None = Query(
        default=None,
        description="Period start (defaults to first day of current month)",
    ),
    end_date: datetime | None = Query(
        default=None,
        description="Period end (defaults to last day of current month)",
    ),
) -> DashboardSummaryResponse:
    return await analytics_service.get_dashboard_summary(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/categories",
    response_model=CategoryBreakdownResponse,
    summary="Expense breakdown by category for pie/donut chart",
)
async def get_category_breakdown(
    current_user: CurrentUser,
    db: DBSession,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
) -> CategoryBreakdownResponse:
    return await analytics_service.get_category_breakdown(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/trends",
    response_model=MonthlyTrendResponse,
    summary="Monthly income vs expense trend for bar chart",
)
async def get_monthly_trend(
    current_user: CurrentUser,
    db: DBSession,
    months: int = Query(
        default=6,
        ge=1,
        le=24,
        description="Number of past months to include in the trend",
    ),
) -> MonthlyTrendResponse:
    return await analytics_service.get_monthly_trend(
        db=db,
        user_id=current_user.id,
        months=months,
    )

