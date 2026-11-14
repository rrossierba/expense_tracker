from datetime import datetime, timezone
from decimal import Decimal
from typing import Sequence
import uuid
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import BadRequestException, NotFoundException
from src.modules.budgets.models import Budget, BudgetPeriod, SavingsGoal
from src.modules.budgets.schemas import (
    BudgetCreate,
    BudgetResponse,
    BudgetUpdate,
    SavingsGoalCreate,
    SavingsGoalDepositWithdraw,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)
from src.modules.transactions.models import Transaction, TransactionType


def _compute_period_bounds(period: BudgetPeriod) -> tuple[datetime, datetime]:
    """Return UTC start and end datetimes for the current budget period."""
    now = datetime.now(timezone.utc)
    if period == BudgetPeriod.MONTHLY:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = (start + relativedelta(months=1)) - relativedelta(seconds=1)
    else:
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = (start + relativedelta(years=1)) - relativedelta(seconds=1)
    return start, end


async def _compute_spent(
    db: AsyncSession,
    user_id: uuid.UUID,
    category_id: uuid.UUID | None,
    start: datetime,
    end: datetime,
) -> Decimal:
    """Aggregate EXPENSE transactions for the given period and optional category."""
    stmt = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.EXPENSE,
        Transaction.date >= start,
        Transaction.date <= end,
    )
    if category_id:
        stmt = stmt.where(Transaction.category_id == category_id)

    result = await db.execute(stmt)
    return Decimal(str(result.scalar_one()))


def _build_budget_response(
    budget: Budget,
    spent: Decimal,
) -> BudgetResponse:
    remaining = max(budget.amount_limit - spent, Decimal("0.00"))
    usage_pct = float((spent / budget.amount_limit) * 100) if budget.amount_limit else 0.0
    response = BudgetResponse.model_validate(budget)
    response.spent_amount = spent
    response.remaining_amount = remaining
    response.usage_percentage = round(min(usage_pct, 100.0), 2)
    return response


class BudgetService:
    @staticmethod
    async def create_budget(
        db: AsyncSession,
        user_id: uuid.UUID,
        budget_in: BudgetCreate,
    ) -> BudgetResponse:
        budget = Budget(
            user_id=user_id,
            category_id=budget_in.category_id,
            amount_limit=budget_in.amount_limit,
            period=budget_in.period,
            notify_threshold=budget_in.notify_threshold,
        )
        db.add(budget)
        await db.commit()
        await db.refresh(budget)

        start, end = _compute_period_bounds(budget.period)
        spent = await _compute_spent(db, user_id, budget.category_id, start, end)
        return _build_budget_response(budget, spent)

    @staticmethod
    async def get_user_budgets(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> list[BudgetResponse]:
        stmt = select(Budget).where(Budget.user_id == user_id)
        result = await db.execute(stmt)
        budgets = result.scalars().all()

        responses: list[BudgetResponse] = []
        for budget in budgets:
            start, end = _compute_period_bounds(budget.period)
            spent = await _compute_spent(db, user_id, budget.category_id, start, end)
            responses.append(_build_budget_response(budget, spent))
        return responses

    @staticmethod
    async def get_budget_by_id(
        db: AsyncSession,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Budget:
        stmt = select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == user_id,
        )
        result = await db.execute(stmt)
        budget = result.scalar_one_or_none()
        if not budget:
            raise NotFoundException("Budget not found")
        return budget

    @classmethod
    async def update_budget(
        cls,
        db: AsyncSession,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
        budget_in: BudgetUpdate,
    ) -> BudgetResponse:
        budget = await cls.get_budget_by_id(db, budget_id, user_id)
        update_data = budget_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(budget, field, value)
        await db.commit()
        await db.refresh(budget)

        start, end = _compute_period_bounds(budget.period)
        spent = await _compute_spent(db, user_id, budget.category_id, start, end)
        return _build_budget_response(budget, spent)

    @classmethod
    async def delete_budget(
        cls,
        db: AsyncSession,
        budget_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        budget = await cls.get_budget_by_id(db, budget_id, user_id)
        await db.delete(budget)
        await db.commit()


def _build_goal_response(goal: SavingsGoal) -> SavingsGoalResponse:
    pct = float((goal.current_amount / goal.target_amount) * 100) if goal.target_amount else 0.0
    response = SavingsGoalResponse.model_validate(goal)
    response.progress_percentage = round(min(pct, 100.0), 2)
    return response


class SavingsGoalService:
    @staticmethod
    async def create_goal(
        db: AsyncSession,
        user_id: uuid.UUID,
        goal_in: SavingsGoalCreate,
    ) -> SavingsGoalResponse:
        goal = SavingsGoal(
            user_id=user_id,
            name=goal_in.name,
            target_amount=goal_in.target_amount,
            icon=goal_in.icon,
            color=goal_in.color,
        )
        db.add(goal)
        await db.commit()
        await db.refresh(goal)
        return _build_goal_response(goal)

    @staticmethod
    async def get_user_goals(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> list[SavingsGoalResponse]:
        stmt = select(SavingsGoal).where(SavingsGoal.user_id == user_id)
        result = await db.execute(stmt)
        return [_build_goal_response(g) for g in result.scalars().all()]

    @staticmethod
    async def get_goal_by_id(
        db: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> SavingsGoal:
        stmt = select(SavingsGoal).where(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == user_id,
        )
        result = await db.execute(stmt)
        goal = result.scalar_one_or_none()
        if not goal:
            raise NotFoundException("Savings goal not found")
        return goal

    @classmethod
    async def update_goal(
        cls,
        db: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
        goal_in: SavingsGoalUpdate,
    ) -> SavingsGoalResponse:
        goal = await cls.get_goal_by_id(db, goal_id, user_id)
        update_data = goal_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)
        await db.commit()
        await db.refresh(goal)
        return _build_goal_response(goal)

    @classmethod
    async def deposit(
        cls,
        db: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
        payload: SavingsGoalDepositWithdraw,
    ) -> SavingsGoalResponse:
        goal = await cls.get_goal_by_id(db, goal_id, user_id)
        goal.current_amount += payload.amount
        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True
        await db.commit()
        await db.refresh(goal)
        return _build_goal_response(goal)

    @classmethod
    async def withdraw(
        cls,
        db: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
        payload: SavingsGoalDepositWithdraw,
    ) -> SavingsGoalResponse:
        goal = await cls.get_goal_by_id(db, goal_id, user_id)
        if payload.amount > goal.current_amount:
            raise BadRequestException(
                "Withdrawal amount exceeds current savings goal balance"
            )
        goal.current_amount -= payload.amount
        goal.is_completed = False
        await db.commit()
        await db.refresh(goal)
        return _build_goal_response(goal)

    @classmethod
    async def delete_goal(
        cls,
        db: AsyncSession,
        goal_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        goal = await cls.get_goal_by_id(db, goal_id, user_id)
        await db.delete(goal)
        await db.commit()


budget_service = BudgetService()
savings_goal_service = SavingsGoalService()

