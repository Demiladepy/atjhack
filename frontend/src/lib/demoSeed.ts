import type { CreditScoreFactors, Debt, Merchant, Transaction } from "@/lib/types";

export const DEMO_MERCHANT: Merchant = {
  id: "demo-mama-nkechi",
  phone: "+2348012345678",
  name: "Mama Nkechi",
  business_type: "Provisions & Building Materials",
  location: "Alaba International Market, Lagos",
  currency: "NGN",
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
};

const PRODUCT_CATALOG = [
  { item: "Rice (50kg bag)", category: "food/grains", min: 68000, max: 92000 },
  { item: "Cement (bag)", category: "building/materials", min: 15000, max: 22000 },
  { item: "Garri (bag)", category: "food/grains", min: 28000, max: 42000 },
  { item: "Sugar (carton)", category: "provisions", min: 18000, max: 32000 },
  { item: "Palm oil (25L)", category: "food/oils", min: 24000, max: 52000 },
  { item: "Noodles (carton)", category: "provisions", min: 9000, max: 18000 },
  { item: "Paint (bucket)", category: "building/finishing", min: 14000, max: 42000 },
];

const CUSTOMER_NAMES = [
  "Alhaji Musa",
  "Mama Joy",
  "Chief Okafor",
  "Blessing",
  "Emeka",
  "Fatima",
  "Ibrahim",
  "Uche",
  "Seyi",
  "Aunty Kemi",
];

function pseudoRand(seed: number) {
  // deterministic 0..1
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(pseudoRand(seed) * arr.length)];
}

function between(min: number, max: number, seed: number) {
  return Math.round(min + (max - min) * pseudoRand(seed));
}

function isoDay(daysAgo: number) {
  const d = new Date();
  d.setHours(11, 15, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function makeId(prefix: string, n: number) {
  return `${prefix}-${n}-${Math.floor(pseudoRand(n) * 1e9)}`;
}

export type DemoStats = {
  weekly: Transaction[];
  monthly: Transaction[];
  debts: Debt[];
  creditScore: CreditScoreFactors;
};

export function buildDemoStats(): DemoStats {
  const txns: Transaction[] = [];

  // 90 days of “alive” business: 2-4 sales/day, some expenses, occasional credit + repayments.
  let txnId = 1;
  for (let day = 89; day >= 0; day--) {
    const salesCount = 2 + Math.floor(pseudoRand(day * 3.1) * 3); // 2..4
    for (let i = 0; i < salesCount; i++) {
      const product = pick(PRODUCT_CATALOG, day * 100 + i);
      const qty = 1 + Math.floor(pseudoRand(day * 7.7 + i) * 4); // 1..4
      const unitPrice = between(product.min, product.max, day * 13 + i);
      const total = unitPrice * qty;
      const creditRoll = pseudoRand(day * 19 + i);
      const isCredit = creditRoll > 0.82; // ~18%
      const isPartial = !isCredit && creditRoll > 0.72; // ~10%
      const customer = pick(CUSTOMER_NAMES, day * 11 + i);
      const amountPaid = isCredit ? 0 : isPartial ? Math.round(total * 0.6) : total;
      const amountOwed = Math.max(0, total - amountPaid);

      txns.push({
        id: makeId("t", txnId++),
        merchant_id: DEMO_MERCHANT.id,
        type: "sale",
        item: product.item,
        quantity: qty,
        unit: product.item.includes("bag") ? "bags" : null,
        unit_price: unitPrice,
        total_amount: total,
        customer_name: customer,
        payment_status: isCredit ? "credit" : isPartial ? "partial" : "paid",
        amount_paid: amountPaid,
        amount_owed: amountOwed,
        category: product.category,
        raw_message: `sold ${qty} ${product.item} ${unitPrice} each to ${customer}${isCredit ? " on credit" : ""}`,
        created_at: isoDay(day),
      });

      // Add a repayment 7-21 days later sometimes
      if (isCredit && pseudoRand(day * 29 + i) > 0.45) {
        const repayDaysLater = 7 + Math.floor(pseudoRand(day * 31 + i) * 15);
        const repayDayAgo = Math.max(0, day - repayDaysLater);
        txns.push({
          id: makeId("t", txnId++),
          merchant_id: DEMO_MERCHANT.id,
          type: "payment_received",
          item: null,
          quantity: null,
          unit: null,
          unit_price: null,
          total_amount: amountOwed,
          customer_name: customer,
          payment_status: "paid",
          amount_paid: amountOwed,
          amount_owed: 0,
          category: null,
          raw_message: `${customer} paid ${amountOwed}`,
          created_at: isoDay(repayDayAgo),
        });
      }
    }

    const expenseChance = pseudoRand(day * 5.3);
    if (expenseChance > 0.55) {
      const exp = between(6000, 55000, day * 17.2);
      txns.push({
        id: makeId("t", txnId++),
        merchant_id: DEMO_MERCHANT.id,
        type: "expense",
        item: pick(["Diesel for generator", "Shop rent", "Transport", "Phone/data", "Market levy"], day * 2.6),
        quantity: null,
        unit: null,
        unit_price: null,
        total_amount: exp,
        customer_name: null,
        payment_status: "paid",
        amount_paid: exp,
        amount_owed: 0,
        category: "operations",
        raw_message: `spent ${exp}`,
        created_at: isoDay(day),
      });
    }
  }

  // Derive debts from credit sales not repaid in the last window.
  const debtsByCustomer: Record<string, { total: number; last: string }> = {};
  for (const t of txns) {
    if (t.type === "sale" && (t.amount_owed || 0) > 0 && t.customer_name) {
      const key = t.customer_name;
      const prev = debtsByCustomer[key];
      const amt = Number(t.amount_owed) || 0;
      const last = t.created_at;
      debtsByCustomer[key] = {
        total: (prev?.total ?? 0) + amt,
        last: prev?.last && prev.last > last ? prev.last : last,
      };
    }
    if (t.type === "payment_received" && t.customer_name) {
      const key = t.customer_name;
      const prev = debtsByCustomer[key];
      if (!prev) continue;
      const paid = Number(t.amount_paid) || 0;
      debtsByCustomer[key] = {
        total: Math.max(0, prev.total - paid),
        last: prev.last,
      };
    }
  }

  const debts: Debt[] = Object.entries(debtsByCustomer)
    .filter(([, v]) => v.total > 0)
    .slice(0, 6)
    .map(([customer_name, v], idx) => {
      const last = v.last || isoDay(8 + idx);
      const overdue = Date.now() - new Date(last).getTime() > 1000 * 60 * 60 * 24 * 30;
      return {
        id: makeId("d", idx + 1),
        merchant_id: DEMO_MERCHANT.id,
        customer_name,
        total_owed: Math.round(v.total),
        status: overdue ? "overdue" : "active",
        last_transaction_at: last,
      };
    })
    .sort((a, b) => b.total_owed - a.total_owed);

  const last90 = txns.filter((t) => {
    const dt = new Date(t.created_at);
    return Date.now() - dt.getTime() <= 1000 * 60 * 60 * 24 * 90;
  });
  const daysWithTxns = new Set(last90.map((t) => t.created_at.slice(0, 10))).size;
  const transaction_consistency = Math.min(100, Math.round((daysWithTxns / 90) * 130));
  const revenue_trend = 71;
  const debt_repayment_rate = 65;
  const business_diversity = 78;
  const weighted =
    transaction_consistency * 0.3 +
    revenue_trend * 0.3 +
    debt_repayment_rate * 0.25 +
    business_diversity * 0.15;
  const overall_score = Math.round(300 + (weighted / 100) * 550);

  const creditScore: CreditScoreFactors = {
    transaction_consistency,
    revenue_trend,
    debt_repayment_rate,
    business_diversity,
    overall_score,
    rating: overall_score >= 750 ? "Excellent" : overall_score >= 650 ? "Good" : overall_score >= 500 ? "Fair" : "Building",
  };

  const weekly = txns
    .filter((t) => Date.now() - new Date(t.created_at).getTime() <= 1000 * 60 * 60 * 24 * 7)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const monthly = txns
    .filter((t) => Date.now() - new Date(t.created_at).getTime() <= 1000 * 60 * 60 * 24 * 90)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return { weekly, monthly, debts, creditScore };
}

export const DEMO_STATS: DemoStats = buildDemoStats();

