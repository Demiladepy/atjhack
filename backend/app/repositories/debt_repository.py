"""Debt ledger data access."""

from datetime import datetime
from typing import Any, Literal

from app.db.client import get_supabase_client


class DebtRepository:
    """Repository for debts (customer credit ledger)."""

    def __init__(self) -> None:
        self._client = get_supabase_client

    @property
    def client(self):
        return self._client()

    def get_by_merchant_and_customer(
        self, merchant_id: str, customer_name: str
    ) -> dict[str, Any] | None:
        """Return the debt row if it exists."""
        result = (
            self.client.table("debts")
            .select("*")
            .eq("merchant_id", merchant_id)
            .eq("customer_name", customer_name)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None

    def get_all_for_merchant(self, merchant_id: str) -> list[dict[str, Any]]:
        """All debts for a merchant (active + settled)."""
        result = (
            self.client.table("debts")
            .select("*")
            .eq("merchant_id", merchant_id)
            .execute()
        )
        return result.data or []

    def get_active_for_merchant(self, merchant_id: str) -> list[dict[str, Any]]:
        """Active debts only (for report text)."""
        result = (
            self.client.table("debts")
            .select("customer_name, total_owed")
            .eq("merchant_id", merchant_id)
            .eq("status", "active")
            .execute()
        )
        return result.data or []

    def update_balance(
        self,
        merchant_id: str,
        customer_name: str,
        amount: float,
        action: Literal["add", "subtract"] = "add",
    ) -> None:
        """Update running debt: add (new credit) or subtract (payment received)."""
        existing = self.get_by_merchant_and_customer(merchant_id, customer_name)
        now = datetime.utcnow().isoformat()

        if existing:
            current_total = float(existing["total_owed"])
            if action == "add":
                new_total = current_total + amount
            else:
                new_total = max(0.0, current_total - amount)
            status = "settled" if new_total == 0 else "active"
            self.client.table("debts").update(
                {
                    "total_owed": new_total,
                    "status": status,
                    "last_transaction_at": now,
                    "updated_at": now,
                }
            ).eq("id", existing["id"]).execute()
        else:
            if action == "add":
                self.client.table("debts").insert(
                    {
                        "merchant_id": merchant_id,
                        "customer_name": customer_name,
                        "total_owed": amount,
                        "status": "active",
                    }
                ).execute()
            # subtract on non-existing debt: no-op (could log)
