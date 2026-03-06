import os
from datetime import datetime, timedelta
from supabase import create_client, Client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)


async def get_or_create_merchant(phone: str, name: str) -> dict:
    """Get existing merchant or create new one."""
    result = supabase.table("merchants").select("*").eq("phone", phone).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]

    new_merchant = (
        supabase.table("merchants")
        .insert({"phone": phone, "name": name})
        .execute()
    )
    return new_merchant.data[0]


async def insert_transaction(merchant_id: str, data: dict) -> dict:
    """Insert a parsed transaction."""
    transaction = {
        "merchant_id": merchant_id,
        "type": data["type"],
        "item": data.get("item"),
        "quantity": data.get("quantity"),
        "unit": data.get("unit"),
        "unit_price": data.get("unit_price"),
        "total_amount": data["total_amount"],
        "customer_name": data.get("customer_name"),
        "payment_status": data.get("payment_status", "paid"),
        "amount_paid": data.get("amount_paid", 0),
        "amount_owed": data.get("amount_owed", 0),
        "category": data.get("category"),
        "raw_message": data.get("raw_message"),
    }

    result = supabase.table("transactions").insert(transaction).execute()
    return result.data[0]


async def update_debt(
    merchant_id: str, customer_name: str, amount: float, action: str = "add"
):
    """Update the running debt ledger for a customer."""
    existing = (
        supabase.table("debts")
        .select("*")
        .eq("merchant_id", merchant_id)
        .eq("customer_name", customer_name)
        .execute()
    )

    if existing.data and len(existing.data) > 0:
        current = existing.data[0]
        if action == "add":
            new_total = float(current["total_owed"]) + amount
        else:
            new_total = max(0, float(current["total_owed"]) - amount)

        status = "settled" if new_total == 0 else "active"
        now = datetime.utcnow().isoformat()

        supabase.table("debts").update(
            {
                "total_owed": new_total,
                "status": status,
                "last_transaction_at": now,
                "updated_at": now,
            }
        ).eq("id", current["id"]).execute()
    else:
        if action == "add":
            supabase.table("debts").insert(
                {
                    "merchant_id": merchant_id,
                    "customer_name": customer_name,
                    "total_owed": amount,
                    "status": "active",
                }
            ).execute()


async def get_weekly_report(merchant_id: str) -> str:
    """Generate a text-based weekly report for WhatsApp."""
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()

    result = (
        supabase.table("transactions")
        .select("*")
        .eq("merchant_id", merchant_id)
        .gte("created_at", week_ago)
        .execute()
    )
    transactions = result.data or []

    if not transactions:
        return "No transactions this week yet. Start by texting me what you sell or buy! 📊"

    total_sales = sum(
        float(t["total_amount"]) for t in transactions if t["type"] == "sale"
    )
    total_expenses = sum(
        float(t["total_amount"])
        for t in transactions
        if t["type"] in ("expense", "purchase")
    )
    total_received = sum(
        float(t.get("amount_paid") or 0) for t in transactions if t["type"] == "sale"
    )
    total_owed = sum(
        float(t.get("amount_owed") or 0)
        for t in transactions
        if t.get("amount_owed") and float(t["amount_owed"]) > 0
    )
    profit = total_sales - total_expenses
    num_transactions = len(transactions)

    debts_result = (
        supabase.table("debts")
        .select("customer_name, total_owed")
        .eq("merchant_id", merchant_id)
        .eq("status", "active")
        .execute()
    )
    debts = debts_result.data or []

    report = f"""📊 *YOUR WEEKLY REPORT*
━━━━━━━━━━━━━━━━━━

💰 Total Sales: ₦{total_sales:,.0f}
💸 Total Expenses: ₦{total_expenses:,.0f}
📈 Profit: ₦{profit:,.0f}
🔢 Transactions: {num_transactions}

💵 Cash Received: ₦{total_received:,.0f}
📝 New Credit Given: ₦{total_owed:,.0f}"""

    if debts:
        report += "\n\n👥 *WHO OWE YOU:*\n"
        for d in debts:
            report += f"  • {d['customer_name']}: ₦{float(d['total_owed']):,.0f}\n"
        total_debt = sum(float(d["total_owed"]) for d in debts)
        report += f"\n  Total Outstanding: ₦{total_debt:,.0f}"

    report += "\n\n💪 Keep going! Text me every sale and expense."

    return report


async def get_daily_report(merchant_id: str) -> str:
    """Generate today's report."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0).isoformat()

    result = (
        supabase.table("transactions")
        .select("*")
        .eq("merchant_id", merchant_id)
        .gte("created_at", today)
        .execute()
    )
    transactions = result.data or []

    if not transactions:
        return "Nothing recorded today yet. Text me your first sale! 🚀"

    total_sales = sum(
        float(t["total_amount"]) for t in transactions if t["type"] == "sale"
    )
    total_expenses = sum(
        float(t["total_amount"])
        for t in transactions
        if t["type"] in ("expense", "purchase")
    )

    return f"""📊 *TODAY SO FAR*\n\n💰 Sales: ₦{total_sales:,.0f}\n💸 Expenses: ₦{total_expenses:,.0f}\n📈 Profit: ₦{total_sales - total_expenses:,.0f}\n🔢 Transactions: {len(transactions)}"""


async def get_monthly_report(merchant_id: str) -> str:
    """Generate this month's report."""
    month_start = (
        datetime.utcnow().replace(day=1, hour=0, minute=0, second=0).isoformat()
    )

    result = (
        supabase.table("transactions")
        .select("*")
        .eq("merchant_id", merchant_id)
        .gte("created_at", month_start)
        .execute()
    )
    transactions = result.data or []

    if not transactions:
        return "No transactions this month yet."

    total_sales = sum(
        float(t["total_amount"]) for t in transactions if t["type"] == "sale"
    )
    total_expenses = sum(
        float(t["total_amount"])
        for t in transactions
        if t["type"] in ("expense", "purchase")
    )
    profit = total_sales - total_expenses

    items = {}
    for t in transactions:
        if t["type"] == "sale" and t.get("item"):
            amt = float(t.get("total_amount") or 0)
            items[t["item"]] = items.get(t["item"], 0) + amt

    top_items = sorted(items.items(), key=lambda x: x[1], reverse=True)[:5]

    report = f"""📊 *MONTHLY REPORT*\n━━━━━━━━━━━━━━━━━━\n\n💰 Total Sales: ₦{total_sales:,.0f}\n💸 Total Expenses: ₦{total_expenses:,.0f}\n📈 Net Profit: ₦{profit:,.0f}\n🔢 Total Transactions: {len(transactions)}"""

    if top_items:
        report += "\n\n🏆 *TOP SELLERS:*\n"
        for item, amount in top_items:
            report += f"  • {item}: ₦{amount:,.0f}\n"

    return report


async def get_merchant_stats(merchant_id: str) -> dict:
    """Get comprehensive stats for the dashboard."""
    week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    month_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()

    weekly_result = (
        supabase.table("transactions")
        .select("*")
        .eq("merchant_id", merchant_id)
        .gte("created_at", week_ago)
        .execute()
    )
    monthly_result = (
        supabase.table("transactions")
        .select("*")
        .eq("merchant_id", merchant_id)
        .gte("created_at", month_ago)
        .execute()
    )
    debts_result = (
        supabase.table("debts")
        .select("*")
        .eq("merchant_id", merchant_id)
        .eq("status", "active")
        .execute()
    )

    return {
        "weekly": weekly_result.data or [],
        "monthly": monthly_result.data or [],
        "debts": debts_result.data or [],
    }


async def get_transactions_for_credit_score(merchant_id: str, days: int = 90) -> list:
    """Fetch transactions in the last N days for credit score calculation."""
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    result = (
        supabase.table("transactions")
        .select("*")
        .eq("merchant_id", merchant_id)
        .gte("created_at", since)
        .execute()
    )
    return result.data or []


async def get_all_debts_for_merchant(merchant_id: str) -> list:
    """Fetch all debts (active + settled) for credit score."""
    result = (
        supabase.table("debts")
        .select("*")
        .eq("merchant_id", merchant_id)
        .execute()
    )
    return result.data or []
