"""Build human-readable report strings for WhatsApp from transaction/debt data."""

from typing import Any


def _safe_float(v: Any) -> float:
    if v is None:
        return 0.0
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def build_daily_report(transactions: list[dict[str, Any]]) -> str:
    """Today's summary. Pass transactions already filtered to today."""
    if not transactions:
        return "Nothing recorded today yet. Text me your first sale! 🚀"

    total_sales = sum(
        _safe_float(t["total_amount"])
        for t in transactions
        if t.get("type") == "sale"
    )
    total_expenses = sum(
        _safe_float(t["total_amount"])
        for t in transactions
        if t.get("type") in ("expense", "purchase")
    )
    profit = total_sales - total_expenses
    return (
        f"📊 *TODAY SO FAR*\n\n"
        f"💰 Sales: ₦{total_sales:,.0f}\n"
        f"💸 Expenses: ₦{total_expenses:,.0f}\n"
        f"📈 Profit: ₦{profit:,.0f}\n"
        f"🔢 Transactions: {len(transactions)}"
    )


def build_weekly_report(
    transactions: list[dict[str, Any]],
    active_debts: list[dict[str, Any]],
) -> str:
    """Weekly summary with debt list. Pass transactions for last 7 days."""
    if not transactions:
        return (
            "No transactions this week yet. Start by texting me what you sell or buy! 📊"
        )

    total_sales = sum(
        _safe_float(t["total_amount"]) for t in transactions if t.get("type") == "sale"
    )
    total_expenses = sum(
        _safe_float(t["total_amount"])
        for t in transactions
        if t.get("type") in ("expense", "purchase")
    )
    total_received = sum(
        _safe_float(t.get("amount_paid"))
        for t in transactions
        if t.get("type") == "sale"
    )
    total_owed = sum(
        _safe_float(t.get("amount_owed"))
        for t in transactions
        if t.get("amount_owed") and _safe_float(t["amount_owed"]) > 0
    )
    profit = total_sales - total_expenses

    report = (
        f"📊 *YOUR WEEKLY REPORT*\n"
        f"━━━━━━━━━━━━━━━━━━\n\n"
        f"💰 Total Sales: ₦{total_sales:,.0f}\n"
        f"💸 Total Expenses: ₦{total_expenses:,.0f}\n"
        f"📈 Profit: ₦{profit:,.0f}\n"
        f"🔢 Transactions: {len(transactions)}\n\n"
        f"💵 Cash Received: ₦{total_received:,.0f}\n"
        f"📝 New Credit Given: ₦{total_owed:,.0f}"
    )
    if active_debts:
        report += "\n\n👥 *WHO OWE YOU:*\n"
        for d in active_debts:
            name = d.get("customer_name", "?")
            owed = _safe_float(d.get("total_owed"))
            report += f"  • {name}: ₦{owed:,.0f}\n"
        total_debt = sum(_safe_float(d.get("total_owed")) for d in active_debts)
        report += f"\n  Total Outstanding: ₦{total_debt:,.0f}"
    report += "\n\n💪 Keep going! Text me every sale and expense."
    return report


def build_monthly_report(transactions: list[dict[str, Any]]) -> str:
    """This month's summary with top sellers."""
    if not transactions:
        return "No transactions this month yet."

    total_sales = sum(
        _safe_float(t["total_amount"]) for t in transactions if t.get("type") == "sale"
    )
    total_expenses = sum(
        _safe_float(t["total_amount"])
        for t in transactions
        if t.get("type") in ("expense", "purchase")
    )
    profit = total_sales - total_expenses

    items: dict[str, float] = {}
    for t in transactions:
        if t.get("type") == "sale" and t.get("item"):
            amt = _safe_float(t.get("total_amount"))
            items[t["item"]] = items.get(t["item"], 0) + amt
    top_items = sorted(items.items(), key=lambda x: x[1], reverse=True)[:5]

    report = (
        f"📊 *MONTHLY REPORT*\n"
        f"━━━━━━━━━━━━━━━━━━\n\n"
        f"💰 Total Sales: ₦{total_sales:,.0f}\n"
        f"💸 Total Expenses: ₦{total_expenses:,.0f}\n"
        f"📈 Net Profit: ₦{profit:,.0f}\n"
        f"🔢 Total Transactions: {len(transactions)}"
    )
    if top_items:
        report += "\n\n🏆 *TOP SELLERS:*\n"
        for item, amount in top_items:
            report += f"  • {item}: ₦{amount:,.0f}\n"
    return report
