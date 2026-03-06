"""Report generation logic including mock credit score."""


def calculate_credit_score(
    merchant_id: str, transactions: list, debts: list
) -> dict:
    """Simple credit score for demo purposes (Part 6 of spec)."""
    # Factor 1: Transaction Consistency (0-100)
    days_with_txns = len(
        set((t.get("created_at") or "")[:10] for t in transactions)
    )
    total_days = 90
    consistency = min(100, (days_with_txns / total_days) * 130)

    # Factor 2: Revenue Trend (0-100)
    monthly_revenue = {}
    for t in transactions:
        if t.get("type") == "sale":
            created = t.get("created_at") or ""
            month = created[:7] if len(created) >= 7 else ""
            if month:
                amt = float(t.get("total_amount") or 0)
                monthly_revenue[month] = monthly_revenue.get(month, 0) + amt
    months = sorted(monthly_revenue.keys())
    if len(months) >= 2:
        first = max(monthly_revenue[months[0]], 1)
        trend = (monthly_revenue[months[-1]] - monthly_revenue[months[0]]) / first
        revenue_score = min(100, max(0, 50 + (trend * 100)))
    else:
        revenue_score = 50

    # Factor 3: Debt Repayment Rate (0-100)
    settled = len([d for d in debts if d.get("status") == "settled"])
    total_debts = len(debts) or 1
    repayment_score = (settled / total_debts) * 100

    # Factor 4: Business Diversity (0-100)
    unique_items = len(set(t.get("item") for t in transactions if t.get("item")))
    unique_customers = len(
        set(t.get("customer_name") for t in transactions if t.get("customer_name"))
    )
    diversity = min(100, (unique_items * 5) + (unique_customers * 3))

    # Overall: weighted average mapped to 300-850 scale
    weighted = (
        consistency * 0.30
        + revenue_score * 0.30
        + repayment_score * 0.25
        + diversity * 0.15
    )
    overall = int(300 + (weighted / 100) * 550)

    if overall >= 750:
        rating = "Excellent"
    elif overall >= 650:
        rating = "Good"
    elif overall >= 500:
        rating = "Fair"
    else:
        rating = "Building"

    return {
        "transaction_consistency": round(consistency),
        "revenue_trend": round(revenue_score),
        "debt_repayment_rate": round(repayment_score),
        "business_diversity": round(diversity),
        "overall_score": overall,
        "rating": rating,
    }
