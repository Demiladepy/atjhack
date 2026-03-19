"""Transaction API: list by merchant with filters."""

from fastapi import APIRouter, HTTPException, Query

from app.deps import MerchantRepo, TransactionRepo
from app.models.schemas import TransactionResponse
from app.core.exceptions import NotFoundError
from app.core.validation import validate_uuid, validate_transaction_type

router = APIRouter()


@router.get("/merchants/{merchant_id}/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    merchant_id: str,
    repo: MerchantRepo,
    tx_repo: TransactionRepo,
    type: str | None = Query(
        None,
        description="Filter by type: sale, expense, purchase, payment_received",
    ),
    limit: int = Query(100, ge=1, le=500),
    days: int | None = Query(None, ge=1, le=365, description="Last N days"),
) -> list[TransactionResponse]:
    """List transactions for a merchant with optional filters."""
    validate_uuid(merchant_id, "merchant_id")
    validate_transaction_type(type)
    try:
        repo.get_by_id(merchant_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    rows = tx_repo.list_by_merchant(
        merchant_id,
        type_filter=type,
        limit=limit,
        days=days,
    )
    return [TransactionResponse(**r) for r in rows]
