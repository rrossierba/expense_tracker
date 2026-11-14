import uuid
from fastapi import APIRouter, status

from src.core.dependencies import CurrentUser, DBSession
from src.modules.budgets.schemas import (
    BudgetCreate,
    BudgetResponse,
    BudgetUpdate,
    SavingsGoalCreate,
    SavingsGoalDepositWithdraw,
    SavingsGoalResponse,
    SavingsGoalUpdate,
)
from src.modules.budgets.service import budget_service, savings_goal_service

router = APIRouter(tags=["Budgets & Savings Goals"])


# ------------------------------------------------------------------------------
# Budget Endpoints
# ------------------------------------------------------------------------------
@router.post(
    "/budgets",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a spending budget",
)
async def create_budget(
    budget_in: BudgetCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> BudgetResponse:
    return await budget_service.create_budget(
        db=db, user_id=current_user.id, budget_in=budget_in
    )


@router.get(
    "/budgets",
    response_model=list[BudgetResponse],
    summary="List budgets with current period usage",
)
async def list_budgets(
    current_user: CurrentUser,
    db: DBSession,
) -> list[BudgetResponse]:
    return await budget_service.get_user_budgets(db=db, user_id=current_user.id)


@router.patch(
    "/budgets/{budget_id}",
    response_model=BudgetResponse,
    summary="Update budget limit or period",
)
async def update_budget(
    budget_id: uuid.UUID,
    budget_in: BudgetUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> BudgetResponse:
    return await budget_service.update_budget(
        db=db,
        budget_id=budget_id,
        user_id=current_user.id,
        budget_in=budget_in,
    )


@router.delete(
    "/budgets/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete budget",
)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    await budget_service.delete_budget(
        db=db, budget_id=budget_id, user_id=current_user.id
    )


# ------------------------------------------------------------------------------
# Savings Goals Endpoints
# ------------------------------------------------------------------------------
@router.post(
    "/savings-goals",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a savings goal",
)
async def create_savings_goal(
    goal_in: SavingsGoalCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> SavingsGoalResponse:
    return await savings_goal_service.create_goal(
        db=db, user_id=current_user.id, goal_in=goal_in
    )


@router.get(
    "/savings-goals",
    response_model=list[SavingsGoalResponse],
    summary="List all savings goals",
)
async def list_savings_goals(
    current_user: CurrentUser,
    db: DBSession,
) -> list[SavingsGoalResponse]:
    return await savings_goal_service.get_user_goals(db=db, user_id=current_user.id)


@router.get(
    "/savings-goals/{goal_id}",
    response_model=SavingsGoalResponse,
    summary="Get savings goal details",
)
async def get_savings_goal(
    goal_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> SavingsGoalResponse:
    goal = await savings_goal_service.get_goal_by_id(
        db=db, goal_id=goal_id, user_id=current_user.id
    )
    from src.modules.budgets.service import _build_goal_response
    return _build_goal_response(goal)


@router.patch(
    "/savings-goals/{goal_id}",
    response_model=SavingsGoalResponse,
    summary="Update savings goal",
)
async def update_savings_goal(
    goal_id: uuid.UUID,
    goal_in: SavingsGoalUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> SavingsGoalResponse:
    return await savings_goal_service.update_goal(
        db=db, goal_id=goal_id, user_id=current_user.id, goal_in=goal_in
    )


@router.post(
    "/savings-goals/{goal_id}/deposit",
    response_model=SavingsGoalResponse,
    summary="Add money to a savings goal",
)
async def deposit_to_goal(
    goal_id: uuid.UUID,
    payload: SavingsGoalDepositWithdraw,
    current_user: CurrentUser,
    db: DBSession,
) -> SavingsGoalResponse:
    return await savings_goal_service.deposit(
        db=db, goal_id=goal_id, user_id=current_user.id, payload=payload
    )


@router.post(
    "/savings-goals/{goal_id}/withdraw",
    response_model=SavingsGoalResponse,
    summary="Withdraw money from a savings goal",
)
async def withdraw_from_goal(
    goal_id: uuid.UUID,
    payload: SavingsGoalDepositWithdraw,
    current_user: CurrentUser,
    db: DBSession,
) -> SavingsGoalResponse:
    return await savings_goal_service.withdraw(
        db=db, goal_id=goal_id, user_id=current_user.id, payload=payload
    )


@router.delete(
    "/savings-goals/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete savings goal",
)
async def delete_savings_goal(
    goal_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    await savings_goal_service.delete_goal(
        db=db, goal_id=goal_id, user_id=current_user.id
    )

