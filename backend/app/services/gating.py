"""Feature gating: Pro subscription required for credit score and premium features."""

from datetime import datetime

from app.db.client import get_supabase_client


def is_pro(merchant_id: str) -> bool:
    """Check if merchant has an active Pro subscription."""
    client = get_supabase_client()
    result = (
        client.table("merchants")
        .select("subscription_plan, paid_until")
        .eq("id", merchant_id)
        .execute()
    )
    if not result.data or len(result.data) == 0:
        return False
    m = result.data[0]
    if m.get("subscription_plan") != "pro":
        return False
    paid_until = m.get("paid_until")
    if not paid_until:
        return False
    try:
        return datetime.fromisoformat(paid_until.replace("Z", "+00:00")) > datetime.utcnow()
    except (TypeError, ValueError):
        return False
