"""Reports API: credit score."""

from fastapi import APIRouter, HTTPException

from app.deps import MerchantRepo, TransactionRepo, DebtRepo
from app.models.schemas import CreditScoreResponse
from app.services.reports import calculate_credit_score
from app.services.gating import is_pro
from app.core.exceptions import NotFoundError

router = APIRouter()


@router.get("/merchants/{merchant_id}/reports/credit-score", response_model=CreditScoreResponse)
async def get_credit_score(
    merchant_id: str,
    repo: MerchantRepo,
    tx_repo: TransactionRepo,
    debt_repo: DebtRepo,
) -> CreditScoreResponse:
    """Get credit score for merchant (Pro subscription required)."""
    try:
        repo.get_by_id(merchant_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    if not is_pro(merchant_id):
        raise HTTPException(
            status_code=402,
            detail="upgrade_required",
        )
    transactions = tx_repo.get_for_credit_score(merchant_id, days=90)
    debts = debt_repo.get_all_for_merchant(merchant_id)
    score = calculate_credit_score(merchant_id, transactions, debts)
    return CreditScoreResponse(**score)
