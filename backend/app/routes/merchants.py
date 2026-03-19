"""Merchant API: list and get one with stats."""

from fastapi import APIRouter, HTTPException

from app.deps import MerchantRepo
from app.models.schemas import (
    MerchantResponse,
    MerchantDetailResponse,
    MerchantStatsResponse,
)
from app.core.exceptions import NotFoundError
from app.core.validation import validate_uuid

router = APIRouter()


@router.get("/merchants", response_model=list[MerchantResponse])
async def list_merchants(repo: MerchantRepo) -> list[MerchantResponse]:
    """List all merchants, newest first."""
    rows = repo.list_all()
    return [MerchantResponse(**r) for r in rows]


@router.get("/merchants/{merchant_id}", response_model=MerchantDetailResponse)
async def get_merchant(merchant_id: str, repo: MerchantRepo) -> MerchantDetailResponse:
    """Get a single merchant with stats (weekly/monthly transactions, active debts)."""
    validate_uuid(merchant_id, "merchant_id")
    try:
        merchant = repo.get_by_id(merchant_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    stats = repo.get_stats(merchant_id)
    return MerchantDetailResponse(
        merchant=merchant,
        stats=MerchantStatsResponse(**stats),
    )
