import enum
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base, TimestampMixin

if TYPE_CHECKING:
    from src.modules.categories.models import Category


class BudgetPeriod(str, enum.Enum):
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    amount_limit: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )
    period: Mapped[BudgetPeriod] = mapped_column(
        Enum(BudgetPeriod, native_enum=False, length=20),
        default=BudgetPeriod.MONTHLY,
        nullable=False,
    )
    # Percentage (0-100) at which to send a warning alert
    notify_threshold: Mapped[int] = mapped_column(
        Integer,
        default=80,
        nullable=False,
    )

    category: Mapped["Category | None"] = relationship("Category")

    def __repr__(self) -> str:
        return f"<Budget id={self.id} limit={self.amount_limit} period={self.period}>"


class SavingsGoal(Base, TimestampMixin):
    __tablename__ = "savings_goals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    target_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )
    current_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<SavingsGoal id={self.id} name={self.name} target={self.target_amount}>"

