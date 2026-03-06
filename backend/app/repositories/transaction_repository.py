"""Transaction data access."""

from datetime import datetime, timedelta
from typing import Any

from app.db.client import get_supabase_client


class TransactionRepository:
    """Repository for transactions."""

    def __init__(self) -> None:
        self._client = get_supabase_client

    @property
    def client(self):
        return self._client()

    def insert(
        self,
        merchant_id: str,
        *,
        type: str,
        total_amount: float,
        item: str | None = None,
        quantity: float | None = None,
        unit: str | None = None,
        unit_price: float | None = None,
        customer_name: str | None = None,
        payment_status: str = "paid",
        amount_paid: float = 0,
        amount_owed: float = 0,
        category: str | None = None,
        raw_message: str | None = None,
    ) -> dict[str, Any]:
        """Insert a single transaction."""
        row = {
            "merchant_id": merchant_id,
            "type": type,
            "total_amount": total_amount,
            "item": item,
            "quantity": quantity,
            "unit": unit,
            "unit_price": unit_price,
            "customer_name": customer_name,
            "payment_status": payment_status,
            "amount_paid": amount_paid,
            "amount_owed": amount_owed,
            "category": category,
            "raw_message": raw_message,
        }
        result = self.client.table("transactions").insert(row).execute()
        return result.data[0]

    def list_by_merchant(
        self,
        merchant_id: str,
        *,
        type_filter: str | None = None,
        limit: int = 100,
        days: int | None = None,
    ) -> list[dict[str, Any]]:
        """List transactions for a merchant with optional filters."""
        query = (
            self.client.table("transactions")
            .select("*")
            .eq("merchant_id", merchant_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if type_filter:
            query = query.eq("type", type_filter)
        if days is not None:
            since = (datetime.utcnow() - timedelta(days=days)).isoformat()
            query = query.gte("created_at", since)
        result = query.execute()
        return result.data or []

    def get_since(self, merchant_id: str, since_iso: str) -> list[dict[str, Any]]:
        """Fetch all transactions for a merchant since a given ISO datetime (for reports)."""
        result = (
            self.client.table("transactions")
            .select("*")
            .eq("merchant_id", merchant_id)
            .gte("created_at", since_iso)
            .execute()
        )
        return result.data or []

    def get_for_credit_score(self, merchant_id: str, days: int = 90) -> list[dict[str, Any]]:
        """Transactions in the last N days for credit score calculation."""
        since = (datetime.utcnow() - timedelta(days=days)).isoformat()
        return self.get_since(merchant_id, since)
