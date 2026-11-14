import uuid
from decimal import Decimal
from typing import Sequence
from sqlalchemy import case, func, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import NotFoundException
from src.modules.accounts.models import Account
from src.modules.accounts.schemas import AccountCreate, AccountResponse, AccountUpdate


class AccountService:
    @staticmethod
    async def build_responses(
        db: AsyncSession,
        accounts: Sequence[Account],
    ) -> list[AccountResponse]:
        """Build API responses with balances derived from the transaction ledger."""
        account_list = list(accounts)
        if not account_list:
            return []

        # Imported lazily to avoid the accounts <-> transactions service cycle.
        from src.modules.transactions.models import Transaction, TransactionType

        account_ids = [account.id for account in account_list]
        user_ids = {account.user_id for account in account_list}

        source_delta = select(
            Transaction.account_id.label("account_id"),
            case(
                (
                    Transaction.type == TransactionType.INCOME,
                    Transaction.amount,
                ),
                (
                    Transaction.type.in_(
                        [TransactionType.EXPENSE, TransactionType.TRANSFER]
                    ),
                    -Transaction.amount,
                ),
                else_=Decimal("0.00"),
            ).label("delta"),
        ).where(
            Transaction.user_id.in_(user_ids),
            Transaction.account_id.in_(account_ids),
        )

        transfer_in_delta = select(
            Transaction.destination_account_id.label("account_id"),
            Transaction.amount.label("delta"),
        ).where(
            Transaction.user_id.in_(user_ids),
            Transaction.type == TransactionType.TRANSFER,
            Transaction.destination_account_id.in_(account_ids),
        )

        ledger = union_all(source_delta, transfer_in_delta).subquery()
        balance_stmt = (
            select(
                ledger.c.account_id,
                func.coalesce(func.sum(ledger.c.delta), 0).label("movement_total"),
            )
            .group_by(ledger.c.account_id)
        )
        balance_result = await db.execute(balance_stmt)
        movement_totals = {
            account_id: Decimal(str(movement_total))
            for account_id, movement_total in balance_result.all()
        }

        return [
            AccountResponse.model_validate(account).model_copy(
                update={
                    "current_balance": account.initial_balance
                    + movement_totals.get(account.id, Decimal("0.00"))
                }
            )
            for account in account_list
        ]

    @classmethod
    async def build_response(
        cls,
        db: AsyncSession,
        account: Account,
    ) -> AccountResponse:
        return (await cls.build_responses(db, [account]))[0]

    @staticmethod
    async def create_account(
        db: AsyncSession,
        user_id: uuid.UUID,
        account_in: AccountCreate,
    ) -> Account:
        account = Account(
            user_id=user_id,
            name=account_in.name,
            type=account_in.type,
            initial_balance=account_in.initial_balance,
            currency=account_in.currency.upper(),
            color=account_in.color,
            icon=account_in.icon,
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)
        return account

    @staticmethod
    async def get_user_accounts(
        db: AsyncSession,
        user_id: uuid.UUID,
        include_archived: bool = False,
    ) -> Sequence[Account]:
        stmt = select(Account).where(Account.user_id == user_id)
        if not include_archived:
            stmt = stmt.where(Account.is_archived.is_(False))
        stmt = stmt.order_by(Account.name.asc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_account_by_id(
        db: AsyncSession,
        account_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Account:
        stmt = select(Account).where(
            Account.id == account_id,
            Account.user_id == user_id,
        )
        result = await db.execute(stmt)
        account = result.scalar_one_or_none()
        if not account:
            raise NotFoundException("Account not found")
        return account

    @classmethod
    async def update_account(
        cls,
        db: AsyncSession,
        account_id: uuid.UUID,
        user_id: uuid.UUID,
        account_in: AccountUpdate,
    ) -> Account:
        account = await cls.get_account_by_id(db, account_id, user_id)
        update_data = account_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(account, field, value)

        await db.commit()
        await db.refresh(account)
        return account

    @classmethod
    async def archive_account(
        cls,
        db: AsyncSession,
        account_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Account:
        account = await cls.get_account_by_id(db, account_id, user_id)
        account.is_archived = True
        await db.commit()
        await db.refresh(account)
        return account


account_service = AccountService()

