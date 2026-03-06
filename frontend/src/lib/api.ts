const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMerchants() {
  return fetchApi<{ id: string; phone: string; name: string | null }[]>(
    "/api/merchants"
  );
}

export async function fetchMerchant(id: string) {
  return fetchApi<{
    merchant: Record<string, unknown>;
    stats: { weekly: unknown[]; monthly: unknown[]; debts: unknown[] };
  }>(`/api/merchants/${id}`);
}

export async function fetchTransactions(
  merchantId: string,
  params?: { type?: string; days?: number; limit?: number }
) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set("type", params.type);
  if (params?.days) sp.set("days", String(params.days));
  if (params?.limit) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return fetchApi<unknown[]>(
    `/api/merchants/${merchantId}/transactions${q ? `?${q}` : ""}`
  );
}

export async function fetchCreditScore(merchantId: string) {
  const res = await fetch(`${API_BASE}/api/merchants/${merchantId}/reports/credit-score`);
  if (res.status === 402) throw new Error("UPGRADE_REQUIRED");
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    transaction_consistency: number;
    revenue_trend: number;
    debt_repayment_rate: number;
    business_diversity: number;
    overall_score: number;
    rating: string;
  }>;
}

export async function initializePayment(merchantId: string, plan: string = "pro_monthly") {
  const res = await fetch(`${API_BASE}/api/payments/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchant_id: merchantId, plan }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ authorization_url: string; reference: string }>;
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${API_BASE}/api/payments/verify/${reference}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    verified: boolean;
    amount: number;
    metadata?: { merchant_id?: string; plan?: string };
  }>;
}
