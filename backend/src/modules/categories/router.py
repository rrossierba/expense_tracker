from typing import Sequence
import uuid
from fastapi import APIRouter, Query, status

from src.core.dependencies import CurrentUser, DBSession
from src.modules.categories.models import CategoryType
from src.modules.categories.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    TagCreate,
    TagResponse,
    TagUpdate,
)
from src.modules.categories.service import category_service, tag_service

router = APIRouter(tags=["Categories & Tags"])


# ------------------------------------------------------------------------------
# Category Endpoints
# ------------------------------------------------------------------------------
@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category or subcategory",
)
async def create_category(
    category_in: CategoryCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> CategoryResponse:
    return await category_service.create_category(
        db=db,
        user_id=current_user.id,
        category_in=category_in,
    )


@router.get(
    "/categories",
    response_model=list[CategoryResponse],
    summary="List all categories available to current user",
)
async def list_categories(
    current_user: CurrentUser,
    db: DBSession,
    category_type: CategoryType | None = Query(
        default=None,
        description="Filter by INCOME or EXPENSE",
    ),
    tree_only: bool = Query(
        default=False,
        description="Return only top-level categories with nested subcategories",
    ),
    include_archived: bool = Query(
        default=False,
        description="Include archived categories",
    ),
) -> Sequence[CategoryResponse]:
    return await category_service.get_categories(
        db=db,
        user_id=current_user.id,
        category_type=category_type,
        tree_only=tree_only,
        include_archived=include_archived,
    )


@router.get(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="Get category details by ID",
)
async def get_category(
    category_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> CategoryResponse:
    return await category_service.get_category_by_id(
        db=db,
        category_id=category_id,
        user_id=current_user.id,
    )


@router.patch(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="Update category",
)
async def update_category(
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> CategoryResponse:
    return await category_service.update_category(
        db=db,
        category_id=category_id,
        user_id=current_user.id,
        category_in=category_in,
    )


@router.delete(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="Soft-archive a category",
)
async def delete_category(
    category_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> CategoryResponse:
    return await category_service.archive_category(
        db=db,
        category_id=category_id,
        user_id=current_user.id,
    )


# ------------------------------------------------------------------------------
# Tag Endpoints
# ------------------------------------------------------------------------------
@router.post(
    "/tags",
    response_model=TagResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a custom tag",
)
async def create_tag(
    tag_in: TagCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> TagResponse:
    return await tag_service.create_tag(
        db=db,
        user_id=current_user.id,
        tag_in=tag_in,
    )


@router.get(
    "/tags",
    response_model=list[TagResponse],
    summary="List all user tags",
)
async def list_tags(
    current_user: CurrentUser,
    db: DBSession,
) -> Sequence[TagResponse]:
    return await tag_service.get_tags(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/tags/{tag_id}",
    response_model=TagResponse,
    summary="Get tag by ID",
)
async def get_tag(
    tag_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> TagResponse:
    return await tag_service.get_tag_by_id(
        db=db,
        tag_id=tag_id,
        user_id=current_user.id,
    )


@router.patch(
    "/tags/{tag_id}",
    response_model=TagResponse,
    summary="Update tag",
)
async def update_tag(
    tag_id: uuid.UUID,
    tag_in: TagUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> TagResponse:
    return await tag_service.update_tag(
        db=db,
        tag_id=tag_id,
        user_id=current_user.id,
        tag_in=tag_in,
    )


@router.delete(
    "/tags/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete tag",
)
async def delete_tag(
    tag_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    await tag_service.delete_tag(
        db=db,
        tag_id=tag_id,
        user_id=current_user.id,
    )

