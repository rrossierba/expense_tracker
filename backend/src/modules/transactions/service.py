from datetime import datetime
from typing import Sequence
import uuid
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import BadRequestException, NotFoundException
from src.modules.accounts.service import account_service
from src.modules.categories.models import Tag
from src.modules.categories.service import category_service
from src.modules.transactions.models import (
    RecurringTransaction,
    Transaction,
    TransactionType,
)
from src.modules.transactions.schemas import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    TransactionCreate,
    TransactionUpdate,
)


class TransactionService:
    @classmethod
    async def create_transaction(
        cls,
        db: AsyncSession,
        user_id: uuid.UUID,
        tx_in: TransactionCreate,
    ) -> Transaction:
        # Validate source account exists and belongs to user
        await account_service.get_account_by_id(db, tx_in.account_id, user_id)

        # Validate transfer logic
        if tx_in.type == TransactionType.TRANSFER:
            if not tx_in.destination_account_id:
                raise BadRequestException(
                    "destination_account_id is required for transfers"
                )
            if tx_in.account_id == tx_in.destination_account_id:
                raise BadRequestException(
                    "Source and destination accounts must be different"
                )
            await account_service.get_account_by_id(
                db, tx_in.destination_account_id, user_id
            )

        # Validate category if specified
        if tx_in.category_id:
            await category_service.get_category_by_id(
                db, tx_in.category_id, user_id
            )

        # Retrieve and assign tags if provided
        tags: list[Tag] = []
        if tx_in.tag_ids:
            tag_stmt = select(Tag).where(
                Tag.id.in_(tx_in.tag_ids),
                Tag.user_id == user_id,
            )
            tag_res = await db.execute(tag_stmt)
            tags = list(tag_res.scalars().all())

        tx = Transaction(
            user_id=user_id,
            account_id=tx_in.account_id,
            destination_account_id=tx_in.destination_account_id,
            category_id=tx_in.category_id,
            amount=tx_in.amount,
            exchange_rate=tx_in.exchange_rate,
            type=tx_in.type,
            date=tx_in.date,
            payee=tx_in.payee,
            description=tx_in.description,
            receipt_url=tx_in.receipt_url,
            is_cleared=tx_in.is_cleared,
            tags=tags,
        )
        db.add(tx)
        await db.commit()
        await db.refresh(tx, attribute_names=["tags"])
        return tx

    @staticmethod
    async def get_transactions(
        db: AsyncSession,
        user_id: uuid.UUID,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        account_id: uuid.UUID | None = None,
        category_id: uuid.UUID | None = None,
        tx_type: TransactionType | None = None,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Sequence[Transaction]:
        stmt = (
            select(Transaction)
            .options(selectinload(Transaction.tags))
            .where(Transaction.user_id == user_id)
        )

        if start_date:
            stmt = stmt.where(Transaction.date >= start_date)
        if end_date:
            stmt = stmt.where(Transaction.date <= end_date)
        if account_id:
            stmt = stmt.where(
                or_(
                    Transaction.account_id == account_id,
                    Transaction.destination_account_id == account_id,
                )
            )
        if category_id:
            stmt = stmt.where(Transaction.category_id == category_id)
        if tx_type:
            stmt = stmt.where(Transaction.type == tx_type)
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Transaction.description.ilike(pattern),
                    Transaction.payee.ilike(pattern),
                )
            )

        stmt = (
            stmt.order_by(Transaction.date.desc(), Transaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_transaction_by_id(
        db: AsyncSession,
        tx_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Transaction:
        stmt = (
            select(Transaction)
            .options(selectinload(Transaction.tags))
            .where(Transaction.id == tx_id, Transaction.user_id == user_id)
        )
        result = await db.execute(stmt)
        tx = result.scalar_one_or_none()
        if not tx:
            raise NotFoundException("Transaction not found")
        return tx

    @classmethod
    async def update_transaction(
        cls,
        db: AsyncSession,
        tx_id: uuid.UUID,
        user_id: uuid.UUID,
        tx_in: TransactionUpdate,
    ) -> Transaction:
        tx = await cls.get_transaction_by_id(db, tx_id, user_id)

        if tx_in.account_id:
            await account_service.get_account_by_id(db, tx_in.account_id, user_id)
        if tx_in.destination_account_id:
            await account_service.get_account_by_id(
                db, tx_in.destination_account_id, user_id
            )
        if tx_in.category_id:
            await category_service.get_category_by_id(
                db, tx_in.category_id, user_id
            )

        effective_type = tx_in.type if tx_in.type is not None else tx.type
        effective_account_id = (
            tx_in.account_id if tx_in.account_id is not None else tx.account_id
        )
        effective_destination_id = (
            tx_in.destination_account_id
            if tx_in.destination_account_id is not None
            else tx.destination_account_id
        )

        if effective_type == TransactionType.TRANSFER:
            if not effective_destination_id:
                raise BadRequestException(
                    "destination_account_id is required for transfers"
                )
            if effective_account_id == effective_destination_id:
                raise BadRequestException(
                    "Source and destination accounts must be different"
                )
            await account_service.get_account_by_id(
                db, effective_destination_id, user_id
            )

        update_data = tx_in.model_dump(exclude_unset=True, exclude={"tag_ids"})
        for field, value in update_data.items():
            setattr(tx, field, value)

        if tx_in.tag_ids is not None:
            tag_stmt = select(Tag).where(
                Tag.id.in_(tx_in.tag_ids),
                Tag.user_id == user_id,
            )
            tag_res = await db.execute(tag_stmt)
            tx.tags = list(tag_res.scalars().all())

        await db.commit()
        await db.refresh(tx, attribute_names=["tags"])
        return tx

    @classmethod
    async def delete_transaction(
        cls,
        db: AsyncSession,
        tx_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        tx = await cls.get_transaction_by_id(db, tx_id, user_id)
        await db.delete(tx)
        await db.commit()


class RecurringTransactionService:
    @staticmethod
    async def create_recurring(
        db: AsyncSession,
        user_id: uuid.UUID,
        recurring_in: RecurringTransactionCreate,
    ) -> RecurringTransaction:
        await account_service.get_account_by_id(
            db, recurring_in.account_id, user_id
        )
        if recurring_in.destination_account_id:
            await account_service.get_account_by_id(
                db, recurring_in.destination_account_id, user_id
            )
        if recurring_in.category_id:
            await category_service.get_category_by_id(
                db, recurring_in.category_id, user_id
            )

        recurring = RecurringTransaction(
            user_id=user_id,
            account_id=recurring_in.account_id,
            destination_account_id=recurring_in.destination_account_id,
            category_id=recurring_in.category_id,
            amount=recurring_in.amount,
            type=recurring_in.type,
            frequency=recurring_in.frequency,
            start_date=recurring_in.start_date,
            next_execution_date=recurring_in.next_execution_date,
            end_date=recurring_in.end_date,
            auto_create=recurring_in.auto_create,
        )
        db.add(recurring)
        await db.commit()
        await db.refresh(recurring)
        return recurring

    @staticmethod
    async def get_user_recurring(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> Sequence[RecurringTransaction]:
        stmt = (
            select(RecurringTransaction)
            .where(RecurringTransaction.user_id == user_id)
            .order_by(RecurringTransaction.next_execution_date.asc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        recurring_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> RecurringTransaction:
        stmt = select(RecurringTransaction).where(
            RecurringTransaction.id == recurring_id,
            RecurringTransaction.user_id == user_id,
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundException("Recurring transaction not found")
        return item

    @classmethod
    async def update_recurring(
        cls,
        db: AsyncSession,
        recurring_id: uuid.UUID,
        user_id: uuid.UUID,
        update_in: RecurringTransactionUpdate,
    ) -> RecurringTransaction:
        item = await cls.get_by_id(db, recurring_id, user_id)
        update_data = update_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        await db.commit()
        await db.refresh(item)
        return item

    @classmethod
    async def delete_recurring(
        cls,
        db: AsyncSession,
        recurring_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        item = await cls.get_by_id(db, recurring_id, user_id)
        await db.delete(item)
        await db.commit()


transaction_service = TransactionService()
recurring_service = RecurringTransactionService()

