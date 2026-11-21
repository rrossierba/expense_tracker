import uuid
from typing import Sequence
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from src.modules.categories.models import Category, CategoryType, Tag
from src.modules.categories.schemas import (
    CategoryCreate,
    CategoryUpdate,
    TagCreate,
    TagUpdate,
)


class CategoryService:
    @classmethod
    async def create_category(
        cls,
        db: AsyncSession,
        user_id: uuid.UUID,
        category_in: CategoryCreate,
    ) -> Category:
        if category_in.parent_id:
            parent = await cls.get_category_by_id(
                db, category_in.parent_id, user_id
            )
            if parent.parent_id is not None:
                raise BadRequestException(
                    "Nesting is limited to 1 level of subcategories"
                )

        category = Category(
            user_id=user_id,
            parent_id=category_in.parent_id,
            name=category_in.name,
            type=category_in.type,
            icon=category_in.icon,
            color=category_in.color,
        )
        db.add(category)
        await db.commit()
        await db.refresh(category, attribute_names=["subcategories"])
        return category

    @staticmethod
    async def get_categories(
        db: AsyncSession,
        user_id: uuid.UUID,
        category_type: CategoryType | None = None,
        tree_only: bool = False,
        include_archived: bool = False,
    ) -> Sequence[Category]:
        # User categories plus system pre-defined categories (user_id IS NULL)
        stmt = (
            select(Category)
            .options(selectinload(Category.subcategories))
            .where(or_(Category.user_id == user_id, Category.user_id.is_(None)))
        )

        if not include_archived:
            stmt = stmt.where(Category.is_archived.is_(False))

        if category_type:
            stmt = stmt.where(Category.type == category_type)

        if tree_only:
            stmt = stmt.where(Category.parent_id.is_(None))

        stmt = stmt.order_by(Category.name.asc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_category_by_id(
        db: AsyncSession,
        category_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Category:
        stmt = (
            select(Category)
            .options(selectinload(Category.subcategories))
            .where(
                Category.id == category_id,
                or_(Category.user_id == user_id, Category.user_id.is_(None)),
            )
        )
        result = await db.execute(stmt)
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundException("Category not found")
        return category

    @classmethod
    async def update_category(
        cls,
        db: AsyncSession,
        category_id: uuid.UUID,
        user_id: uuid.UUID,
        category_in: CategoryUpdate,
    ) -> Category:
        category = await cls.get_category_by_id(db, category_id, user_id)
        if category.user_id is None:
            raise ForbiddenException(
                "System default categories cannot be modified"
            )

        if category_in.parent_id:
            if category_in.parent_id == category_id:
                raise BadRequestException("A category cannot be its own parent")
            parent = await cls.get_category_by_id(
                db, category_in.parent_id, user_id
            )
            if parent.parent_id is not None:
                raise BadRequestException(
                    "Nesting is limited to 1 level of subcategories"
                )

        update_data = category_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)

        await db.commit()
        await db.refresh(category)
        return category

    @classmethod
    async def archive_category(
        cls,
        db: AsyncSession,
        category_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Category:
        category = await cls.get_category_by_id(db, category_id, user_id)
        if category.user_id is None:
            raise ForbiddenException(
                "System default categories cannot be archived"
            )

        category.is_archived = True
        await db.commit()
        await db.refresh(category)
        return category


class TagService:
    @staticmethod
    async def create_tag(
        db: AsyncSession,
        user_id: uuid.UUID,
        tag_in: TagCreate,
    ) -> Tag:
        tag = Tag(
            user_id=user_id,
            name=tag_in.name,
            color=tag_in.color,
        )
        db.add(tag)
        await db.commit()
        await db.refresh(tag)
        return tag

    @staticmethod
    async def get_tags(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> Sequence[Tag]:
        stmt = (
            select(Tag).where(Tag.user_id == user_id).order_by(Tag.name.asc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_tag_by_id(
        db: AsyncSession,
        tag_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Tag:
        stmt = select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
        result = await db.execute(stmt)
        tag = result.scalar_one_or_none()
        if not tag:
            raise NotFoundException("Tag not found")
        return tag

    @classmethod
    async def update_tag(
        cls,
        db: AsyncSession,
        tag_id: uuid.UUID,
        user_id: uuid.UUID,
        tag_in: TagUpdate,
    ) -> Tag:
        tag = await cls.get_tag_by_id(db, tag_id, user_id)
        update_data = tag_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tag, field, value)

        await db.commit()
        await db.refresh(tag)
        return tag

    @classmethod
    async def delete_tag(
        cls,
        db: AsyncSession,
        tag_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        tag = await cls.get_tag_by_id(db, tag_id, user_id)
        await db.delete(tag)
        await db.commit()


category_service = CategoryService()
tag_service = TagService()

