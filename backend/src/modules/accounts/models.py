import enum
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base, TimestampMixin

if TYPE_CHECKING:
    from src.modules.auth.models import User


class AccountType(str, enum.Enum):
    CHECKING = "CHECKING"
    SAVINGS = "SAVINGS"
    CREDIT_CARD = "CREDIT_CARD"
    CASH = "CASH"
    INVESTMENT = "INVESTMENT"


class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

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
    type: Mapped[AccountType] = mapped_column(
        Enum(AccountType, native_enum=False, length=20),
        default=AccountType.CHECKING,
        nullable=False,
    )
    initial_balance: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="EUR",
        nullable=False,
    )
    color: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )
    icon: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="accounts",
    )

    def __repr__(self) -> str:
        return f"<Account id={self.id} name={self.name} currency={self.currency}>"

