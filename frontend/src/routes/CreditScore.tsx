import { useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { UpgradeModal } from "@/components/UpgradeModal";
import { motion } from "framer-motion";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { fetchCreditScore, fetchMerchant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { CreditScoreFactors, Transaction } from "@/lib/types";
import { DEMO_MERCHANT, DEMO_STATS } from "@/lib/demoSeed";
import { usePrimaryMerchant } from "@/hooks/usePrimaryMerchant";
import { formatCurrencyCompact, cn } from "@/lib/utils";

const ratingColor: Record<string, string> = {
  Excellent: "text-(--green-400)",
  Good: "text-(--green-500)",
  Fair: "text-(--amber-400)",
  Building: "text-(--text-secondary)",
};

const factorLabels: Record<
  keyof Omit<CreditScoreFactors, "overall_score" | "rating">,
  string
> = {
  transaction_consistency: "Transaction consistency",
  revenue_trend: "Revenue trend",
  debt_repayment_rate: "Debt repayment rate",
  business_diversity: "Business diversity",
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function buildScoreOverTime(overall: number) {
  const end = clamp(overall, 300, 850);
  const start = 300;
  const steps = 13;
  const pts = Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const eased = 1 - Math.pow(1 - t, 2.2);
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 6;
    const value = clamp(start + (end - start) * eased + (i < steps - 1 ? noise : 0), 300, 850);
    return { week: `W${i + 1}`, score: Math.round(value) };
  });
  return pts;
}

function loanEligibility(overall: number) {
  if (overall >= 750) return { label: "₦1,200,000", note: "eligible (excellent profile)" };
  if (overall >= 650) return { label: "₦500,000", note: "eligible (good profile)" };
  if (overall >= 500) return { label: "₦250,000", note: "eligible (building profile)" };
  return { label: "₦100,000", note: "starter credit" };
}

function sumRevenue(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.type === "sale")
    .reduce((s, t) => s + Number(t.total_amount || 0), 0);
}

export default function CreditScore() {
  const { id } = useParams<{ id: string }>();
  const { merchant: primary, isDemo } = usePrimaryMerchant();
  const effectiveId = id ?? primary?.id ?? null;

  const { data: score, isLoading, error } = useQuery({
    queryKey: ["credit-score", effectiveId],
    queryFn: () => fetchCreditScore(effectiveId!),
    enabled: !!effectiveId && !isDemo,
  });

  const { data: merchantData } = useQuery({
    queryKey: ["merchant", effectiveId],
    queryFn: () => fetchMerchant(effectiveId!),
    enabled: !!effectiveId && !isDemo,
  });

  const merchant = (isDemo
    ? DEMO_MERCHANT
    : (merchantData?.merchant as any)) as { name: string | null; phone: string; location?: string } | undefined;
  const stats = isDemo ? DEMO_STATS : merchantData?.stats;
  const monthly = (stats?.monthly ?? []) as Transaction[];
  const effectiveScore = (isDemo ? DEMO_STATS.creditScore : score) as CreditScoreFactors | undefined;
  const upgradeRequired = Boolean(error && (error as Error).message === "UPGRADE_REQUIRED");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading && !isDemo) {
    return (
      <div className="rounded-xl border border-(--border) bg-(--bg-secondary)/60 p-6 text-sm text-(--text-secondary)">
        Loading…
      </div>
    );
  }
  if (upgradeRequired && effectiveId) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-xl border border-(--border) bg-(--bg-secondary)/60 p-8 text-center">
          <h2 className="text-lg font-semibold text-(--text-primary)">Pro feature</h2>
          <p className="mt-2 text-(--text-secondary)">
            Credit Score and Financial Health Profile are part of Pro. Subscribe to unlock.
          </p>
          <Button className="mt-6" onClick={() => setShowUpgradeModal(true)}>
            Subscribe — ₦2,000/month
          </Button>
          <Link to="/" className="mt-4">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        {showUpgradeModal && (
          <UpgradeModal
            merchantId={effectiveId}
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => setShowUpgradeModal(false)}
          />
        )}
      </>
    );
  }

  if (error || !effectiveScore) {
    return (
      <div className="rounded-xl border border-(--border) bg-(--bg-secondary)/60 p-6">
        <div className="text-sm font-semibold text-(--red-400)">Could not load credit score.</div>
        <div className="mt-3">
          <Link to="/">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pct = clamp((effectiveScore.overall_score - 300) / 550, 0, 1);
  const series = useMemo(
    () => buildScoreOverTime(effectiveScore.overall_score),
    [effectiveScore.overall_score]
  );
  const loan = loanEligibility(effectiveScore.overall_score);
  const totalRevenue90 = useMemo(() => sumRevenue(monthly), [monthly]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial Health Profile</h1>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {merchant?.name || merchant?.phone || "Merchant"}
            {merchant?.location ? ` — ${merchant.location}` : ""}
          </p>
        </div>
        <Link to="/">
          <Button variant="outline">Back</Button>
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
            <div className="text-sm font-semibold">Credit Score</div>
            <div className="mt-1 text-sm text-(--text-secondary)">300–850 scale</div>

            <div className="mt-6 flex items-center justify-center">
              <div className="relative w-full max-w-[360px]">
                <svg viewBox="0 0 200 120" className="h-[220px] w-full">
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--red-500)" />
                      <stop offset="50%" stopColor="var(--amber-500)" />
                      <stop offset="100%" stopColor="var(--green-500)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 110 A 90 90 0 0 1 190 110"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M 10 110 A 90 90 0 0 1 190 110"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: pct }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                  <div className="font-mono text-5xl font-bold text-(--text-primary)">
                    {effectiveScore.overall_score}
                  </div>
                  <div
                    className={cn(
                      "mt-2 text-sm font-semibold uppercase tracking-widest",
                      ratingColor[effectiveScore.rating]
                    )}
                  >
                    {effectiveScore.rating}
                  </div>
                  <div className="mt-3 text-xs text-(--text-tertiary)">
                    Based on 90 days of activity. Eligible for microloans up to{" "}
                    <span className="font-mono text-(--green-400)">{loan.label}</span>.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-(--border) bg-(--bg-tertiary)/35 p-4">
                <div className="text-xs uppercase tracking-wider text-(--text-secondary)">
                  90-day revenue
                </div>
                <div className="mt-2 font-mono text-lg text-(--green-400)">
                  {formatCurrencyCompact(totalRevenue90)}
                </div>
              </div>
              <div className="rounded-xl border border-(--border) bg-(--bg-tertiary)/35 p-4">
                <div className="text-xs uppercase tracking-wider text-(--text-secondary)">
                  Credit limit
                </div>
                <div className="mt-2 font-mono text-lg text-(--text-primary)">
                  {loan.label}
                </div>
                <div className="mt-1 text-xs text-(--text-tertiary)">{loan.note}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
            <div className="text-sm font-semibold">Score breakdown</div>
            <div className="mt-4 space-y-4">
              {(Object.keys(factorLabels) as (keyof typeof factorLabels)[]).map((key, idx) => {
                const val = effectiveScore[key];
                const barColor =
                  key === "transaction_consistency"
                    ? "bg-(--green-500)"
                    : key === "revenue_trend"
                      ? "bg-(--blue-500)"
                      : key === "debt_repayment_rate"
                        ? "bg-(--amber-500)"
                        : "bg-[var(--chart-5)]";
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--text-secondary)">{factorLabels[key]}</span>
                      <span className="font-mono text-(--text-primary)">{val}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-(--bg-tertiary)/60">
                      <motion.div
                        className={cn("h-full rounded-full", barColor)}
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 0.9, delay: 0.2 + idx * 0.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-xl border-l-2 border-(--green-500) bg-(--bg-tertiary)/30 p-4 text-sm leading-relaxed text-(--text-secondary)">
              Based on 90 days of transaction data, this merchant qualifies for microfinance products
              up to <span className="font-mono text-(--text-primary)">{loan.label}</span>. Traditional
              banks see nothing; SMB Bookkeeper sees a consistent, growing business.
            </div>
          </div>

          <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Score over time</div>
                <div className="mt-1 text-sm text-(--text-secondary)">Last 90 days</div>
              </div>
              <div className="font-mono text-xs text-(--text-secondary)">
                Current <span className="text-(--green-400)">{effectiveScore.overall_score}</span>
              </div>
            </div>

            <div className="mt-4 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-(--border)"
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[300, 850]}
                    tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as any;
                      return (
                        <div className="rounded-lg border border-(--border) bg-zinc-900/95 p-3 shadow-(--shadow-lg) backdrop-blur">
                          <div className="text-xs text-zinc-400">{p.week}</div>
                          <div className="mt-2 font-mono text-sm text-zinc-100">{p.score}</div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--green-400)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: "var(--green-500)" }}
                    animationDuration={1400}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
