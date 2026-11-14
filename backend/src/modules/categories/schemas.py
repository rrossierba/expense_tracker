from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field

from src.modules.categories.models import CategoryType


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: CategoryType = Field(default=CategoryType.EXPENSE)
    parent_id: uuid.UUID | None = Field(
        default=None,
        description="Optional parent category ID for subcategories",
    )
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=30)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    type: CategoryType | None = None
    parent_id: uuid.UUID | None = None
    icon: str | None = None
    color: str | None = None
    is_archived: bool | None = None


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    user_id: uuid.UUID | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    subcategories: list["CategoryResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str | None = Field(default=None, max_length=30)


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = None


class TagResponse(TagBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

