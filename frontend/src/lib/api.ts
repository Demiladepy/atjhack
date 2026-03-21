const API_BASE = import.meta.env.VITE_API_URL ?? "";
const API_KEY = import.meta.env.VITE_DASHBOARD_API_KEY ?? "";

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  return headers;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
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
  const res = await fetch(`${API_BASE}/api/merchants/${merchantId}/reports/credit-score`, {
    headers: authHeaders(),
  });
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
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ merchant_id: merchantId, plan }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ authorization_url: string; reference: string }>;
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${API_BASE}/api/payments/verify/${reference}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    verified: boolean;
    amount: number;
    metadata?: { merchant_id?: string; plan?: string };
  }>;
}

export async function sendWhatsAppOtp(phone: string) {
  const res = await fetch(`${API_BASE}/api/auth/whatsapp/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Failed to send OTP" }));
    throw new Error(data.detail || "Failed to send OTP");
  }
  return res.json() as Promise<{ success: boolean; message: string }>;
}

export async function verifyWhatsAppOtp(phone: string, otp: string) {
  const res = await fetch(`${API_BASE}/api/auth/whatsapp/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(data.detail || "Verification failed");
  }
  return res.json() as Promise<{ success: boolean; token: string }>;
}
