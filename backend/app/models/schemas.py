from typing import Optional, Literal, Any
from pydantic import BaseModel, ConfigDict


# Transaction data from LLM
class TransactionData(BaseModel):
    type: Literal["sale", "expense", "purchase", "payment_received"]
    item: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    total_amount: float
    customer_name: Optional[str] = None
    payment_status: Literal["paid", "partial", "credit", "pending"] = "paid"
    amount_paid: float = 0
    amount_owed: float = 0
    category: Optional[str] = None


# API response models
class MerchantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    phone: str
    name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    currency: str = "NGN"
    created_at: str
    updated_at: Optional[str] = None


class MerchantStatsResponse(BaseModel):
    """Weekly/monthly transaction lists and active debts for dashboard."""

    weekly: list[dict] = []
    monthly: list[dict] = []
    debts: list[dict] = []


class MerchantDetailResponse(BaseModel):
    """Single merchant with stats."""

    merchant: dict[str, Any]
    stats: MerchantStatsResponse


class TransactionResponse(BaseModel):
    id: str
    merchant_id: str
    type: str
    item: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    total_amount: float
    customer_name: Optional[str] = None
    payment_status: str
    amount_paid: float
    amount_owed: float
    category: Optional[str] = None
    raw_message: Optional[str] = None
    created_at: str


class DebtResponse(BaseModel):
    id: str
    merchant_id: str
    customer_name: str
    total_owed: float
    status: str
    last_transaction_at: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class CreditScoreResponse(BaseModel):
    transaction_consistency: int
    revenue_trend: int
    debt_repayment_rate: int
    business_diversity: int
    overall_score: int
    rating: Literal["Excellent", "Good", "Fair", "Building"]
