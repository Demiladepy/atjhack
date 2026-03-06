"""Merchant data access."""

from datetime import datetime, timedelta
from typing import Any

from app.db.client import get_supabase_client
from app.core.exceptions import NotFoundError


class MerchantRepository:
    """Repository for merchants and merchant stats."""

    def __init__(self) -> None:
        self._client = get_supabase_client

    @property
    def client(self):
        return self._client()

    def get_by_id(self, merchant_id: str) -> dict[str, Any]:
        """Fetch a merchant by id. Raises NotFoundError if not found."""
        result = (
            self.client.table("merchants")
            .select("*")
            .eq("id", merchant_id)
            .execute()
        )
        if not result.data or len(result.data) == 0:
            raise NotFoundError("Merchant", merchant_id)
        return result.data[0]

    def get_by_phone(self, phone: str) -> dict[str, Any] | None:
        """Return merchant if exists, else None."""
        result = (
            self.client.table("merchants")
            .select("*")
            .eq("phone", phone)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None

    def list_all(self, order_desc: bool = True) -> list[dict[str, Any]]:
        """List all merchants, newest first by default."""
        query = self.client.table("merchants").select("*")
        if order_desc:
            query = query.order("created_at", desc=True)
        result = query.execute()
        return result.data or []

    def create(self, phone: str, name: str) -> dict[str, Any]:
        """Create a new merchant. Caller should ensure phone is unique."""
        result = (
            self.client.table("merchants")
            .insert({"phone": phone, "name": name})
            .execute()
        )
        return result.data[0]

    def get_or_create(self, phone: str, name: str) -> dict[str, Any]:
        """Get existing merchant by phone or create new one."""
        existing = self.get_by_phone(phone)
        if existing:
            return existing
        return self.create(phone, name)

    def get_stats(self, merchant_id: str) -> dict[str, Any]:
        """Get weekly/monthly transactions and active debts for dashboard."""
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        month_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()

        weekly = (
            self.client.table("transactions")
            .select("*")
            .eq("merchant_id", merchant_id)
            .gte("created_at", week_ago)
            .execute()
        )
        monthly = (
            self.client.table("transactions")
            .select("*")
            .eq("merchant_id", merchant_id)
            .gte("created_at", month_ago)
            .execute()
        )
        debts = (
            self.client.table("debts")
            .select("*")
            .eq("merchant_id", merchant_id)
            .eq("status", "active")
            .execute()
        )
        return {
            "weekly": weekly.data or [],
            "monthly": monthly.data or [],
            "debts": debts.data or [],
        }
