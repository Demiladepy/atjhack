"""
Generate 90 days of realistic Nigerian merchant data.
Run from repo root: python scripts/seed_data.py
Requires .env with SUPABASE_URL and SUPABASE_KEY (e.g. in backend/ or root).
"""
import os
import random
import sys
from datetime import datetime, timedelta

# Load env from backend/.env or repo root .env
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
if not url or not key:
    print("Set SUPABASE_URL and SUPABASE_KEY in .env (e.g. backend/.env)")
    sys.exit(1)

supabase = create_client(url, key)

MERCHANT = {
    "phone": "+2348012345678",
    "name": "Mama Nkechi",
    "business_type": "Provisions & Building Materials",
    "location": "Alaba International Market, Lagos",
    "currency": "NGN",
}

ITEMS = [
    {"item": "cement", "unit": "bags", "price_range": (4500, 5500), "category": "building"},
    {"item": "rice", "unit": "bags", "price_range": (42000, 55000), "category": "food/grains"},
    {"item": "garri", "unit": "bags", "price_range": (8000, 15000), "category": "food/grains"},
    {"item": "sugar", "unit": "bags", "price_range": (28000, 35000), "category": "food"},
    {"item": "groundnut oil", "unit": "cartons", "price_range": (18000, 25000), "category": "food/oil"},
    {"item": "peak milk", "unit": "cartons", "price_range": (12000, 16000), "category": "food/dairy"},
    {"item": "indomie noodles", "unit": "cartons", "price_range": (5500, 7500), "category": "food"},
    {"item": "coca-cola", "unit": "crates", "price_range": (3500, 5000), "category": "beverages"},
    {"item": "roofing sheets", "unit": "pieces", "price_range": (4000, 6500), "category": "building"},
    {"item": "paint", "unit": "buckets", "price_range": (8000, 15000), "category": "building"},
]

CUSTOMERS = [
    "Alhaji Musa", "Mama Joy", "Chief Okafor", "Blessing", "Emeka",
    "Fatima", "Brother James", "Aunty Shade", "Tunde", "Sister Mary",
    "Baba Ade", "Chioma", "Uche", "Kola", "Ngozi",
]

EXPENSES = [
    {"item": "diesel (generator)", "range": (15000, 35000), "category": "operations/fuel"},
    {"item": "transport/delivery", "range": (5000, 15000), "category": "logistics"},
    {"item": "shop rent", "range": (150000, 150000), "category": "rent", "monthly": True},
    {"item": "phone airtime", "range": (2000, 5000), "category": "communications"},
    {"item": "food/lunch", "range": (1500, 3000), "category": "personal"},
    {"item": "shop boy salary", "range": (40000, 40000), "category": "wages", "monthly": True},
]


def seed():
    existing = supabase.table("merchants").select("id").eq("phone", MERCHANT["phone"]).execute()
    if existing.data and len(existing.data) > 0:
        merchant_id = existing.data[0]["id"]
        print(f"Merchant exists: {merchant_id}")
    else:
        result = supabase.table("merchants").insert(MERCHANT).execute()
        merchant_id = result.data[0]["id"]
        print(f"Merchant: {merchant_id}")

    transactions = []
    now = datetime.utcnow()

    for day_offset in range(90, 0, -1):
        date = now - timedelta(days=day_offset)

        if random.random() < 0.15:
            continue

        num_sales = random.randint(3, 8)
        for _ in range(num_sales):
            item_info = random.choice(ITEMS)
            qty = random.randint(1, 10)
            price = random.randint(*item_info["price_range"])
            total = qty * price

            is_credit = random.random() < 0.3
            customer = random.choice(CUSTOMERS)

            if is_credit:
                paid_pct = random.choice([0, 0.3, 0.5, 0.7])
                amount_paid = round(total * paid_pct)
                amount_owed = total - amount_paid
                status = "credit" if paid_pct == 0 else "partial"
            else:
                amount_paid = total
                amount_owed = 0
                status = "paid"
                customer = random.choice(CUSTOMERS) if random.random() < 0.4 else None

            hour = random.randint(7, 19)
            minute = random.randint(0, 59)
            timestamp = date.replace(hour=hour, minute=minute)

            transactions.append({
                "merchant_id": merchant_id,
                "type": "sale",
                "item": item_info["item"],
                "quantity": qty,
                "unit": item_info["unit"],
                "unit_price": price,
                "total_amount": total,
                "customer_name": customer,
                "payment_status": status,
                "amount_paid": amount_paid,
                "amount_owed": amount_owed,
                "category": item_info["category"],
                "raw_message": f"sold {qty} {item_info['unit']} {item_info['item']} {price}",
                "created_at": timestamp.isoformat(),
            })

        num_expenses = random.randint(1, 3)
        for _ in range(num_expenses):
            expense = random.choice([e for e in EXPENSES if not e.get("monthly")])
            amount = random.randint(*expense["range"])
            hour = random.randint(7, 19)
            timestamp = date.replace(hour=hour, minute=random.randint(0, 59))
            transactions.append({
                "merchant_id": merchant_id,
                "type": "expense",
                "item": expense["item"],
                "total_amount": amount,
                "payment_status": "paid",
                "amount_paid": amount,
                "amount_owed": 0,
                "category": expense["category"],
                "raw_message": f"buy {expense['item']} {amount}",
                "created_at": timestamp.isoformat(),
            })

        if date.day == 1:
            for expense in [e for e in EXPENSES if e.get("monthly")]:
                amount = expense["range"][0]
                transactions.append({
                    "merchant_id": merchant_id,
                    "type": "expense",
                    "item": expense["item"],
                    "total_amount": amount,
                    "payment_status": "paid",
                    "amount_paid": amount,
                    "amount_owed": 0,
                    "category": expense["category"],
                    "created_at": date.replace(hour=9).isoformat(),
                })

        if random.random() < 0.2:
            customer = random.choice(CUSTOMERS)
            amount = random.randint(10000, 50000)
            transactions.append({
                "merchant_id": merchant_id,
                "type": "payment_received",
                "item": None,
                "total_amount": amount,
                "customer_name": customer,
                "payment_status": "paid",
                "amount_paid": amount,
                "amount_owed": 0,
                "category": None,
                "raw_message": f"{customer} pay me {amount}",
                "created_at": date.replace(hour=random.randint(10, 17)).isoformat(),
            })

    chunk_size = 100
    for i in range(0, len(transactions), chunk_size):
        chunk = transactions[i : i + chunk_size]
        supabase.table("transactions").insert(chunk).execute()

    print(f"Seeded {len(transactions)} transactions over 90 days")

    debt_customers = random.sample(CUSTOMERS, 6)
    for customer in debt_customers:
        supabase.table("debts").upsert(
            {
                "merchant_id": merchant_id,
                "customer_name": customer,
                "total_owed": random.randint(15000, 120000),
                "status": "active",
            },
            on_conflict="merchant_id,customer_name",
        ).execute()

    print(f"Seeded {len(debt_customers)} active debts")


if __name__ == "__main__":
    seed()
