from datetime import datetime, timezone
from decimal import Decimal
import uuid
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.accounts.models import Account
from src.modules.accounts.service import account_service
from src.modules.categories.models import Category
from src.modules.transactions.models import Transaction, TransactionType
from src.modules.analytics.schemas import (
    AccountBalance,
    CategoryBreakdown,
    CategoryBreakdownResponse,
    DashboardSummaryResponse,
    MonthlyTrend,
    MonthlyTrendResponse,
)


def _current_month_bounds() -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end = (start + relativedelta(months=1)) - relativedelta(seconds=1)
    return start, end


class AnalyticsService:
    @staticmethod
    async def get_dashboard_summary(
        db: AsyncSession,
        user_id: uuid.UUID,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> DashboardSummaryResponse:
        if not start_date or not end_date:
            start_date, end_date = _current_month_bounds()

        # Aggregate income for period
        income_stmt = select(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).where(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        )
        income_result = await db.execute(income_stmt)
        total_income = Decimal(str(income_result.scalar_one()))

        # Aggregate expenses for period
        expense_stmt = select(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).where(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        )
        expense_result = await db.execute(expense_stmt)
        total_expense = Decimal(str(expense_result.scalar_one()))

        # Per-account current balance = initial_balance + income - expenses (simplified)
        accounts_stmt = select(Account).where(
            Account.user_id == user_id,
            Account.is_archived.is_(False),
        )
        accounts_result = await db.execute(accounts_stmt)
        accounts = accounts_result.scalars().all()

        account_responses = await account_service.build_responses(db, accounts)
        account_balances = [
            AccountBalance(
                account_id=account.id,
                account_name=account.name,
                currency=account.currency,
                initial_balance=account.initial_balance,
                current_balance=account.current_balance,
            )
            for account in account_responses
        ]
        net_worth = sum(
            (account.current_balance for account in account_responses),
            start=Decimal("0.00"),
        )

        return DashboardSummaryResponse(
            period_start=start_date,
            period_end=end_date,
            total_income=total_income,
            total_expense=total_expense,
            net_balance=total_income - total_expense,
            net_worth=net_worth,
            account_balances=account_balances,
        )

    @staticmethod
    async def get_category_breakdown(
        db: AsyncSession,
        user_id: uuid.UUID,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> CategoryBreakdownResponse:
        if not start_date or not end_date:
            start_date, end_date = _current_month_bounds()

        stmt = (
            select(
                Transaction.category_id,
                func.sum(Transaction.amount).label("total"),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.date >= start_date,
                Transaction.date <= end_date,
            )
            .group_by(Transaction.category_id)
            .order_by(func.sum(Transaction.amount).desc())
        )
        rows = (await db.execute(stmt)).all()

        grand_total = sum((Decimal(str(row.total)) for row in rows), Decimal("0.00"))
        breakdown: list[CategoryBreakdown] = []

        for row in rows:
            amount = Decimal(str(row.total))
            pct = float((amount / grand_total) * 100) if grand_total else 0.0

            category_name = "Uncategorized"
            if row.category_id:
                cat = await db.get(Category, row.category_id)
                if cat:
                    category_name = cat.name

            breakdown.append(
                CategoryBreakdown(
                    category_id=row.category_id,
                    category_name=category_name,
                    total=amount,
                    percentage=round(pct, 2),
                )
            )

        return CategoryBreakdownResponse(
            period_start=start_date,
            period_end=end_date,
            total_expense=grand_total,
            breakdown=breakdown,
        )

    @staticmethod
    async def get_monthly_trend(
        db: AsyncSession,
        user_id: uuid.UUID,
        months: int = 6,
    ) -> MonthlyTrendResponse:
        now = datetime.now(timezone.utc)
        trend_data: list[MonthlyTrend] = []

        for i in range(months - 1, -1, -1):
            period_start = (now - relativedelta(months=i)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            period_end = (period_start + relativedelta(months=1)) - relativedelta(seconds=1)

            income_res = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.INCOME,
                    Transaction.date >= period_start,
                    Transaction.date <= period_end,
                )
            )
            expense_res = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.EXPENSE,
                    Transaction.date >= period_start,
                    Transaction.date <= period_end,
                )
            )
            income = Decimal(str(income_res.scalar_one()))
            expense = Decimal(str(expense_res.scalar_one()))

            trend_data.append(
                MonthlyTrend(
                    year=period_start.year,
                    month=period_start.month,
                    total_income=income,
                    total_expense=expense,
                    net=income - expense,
                )
            )

        return MonthlyTrendResponse(months=months, data=trend_data)


analytics_service = AnalyticsService()

