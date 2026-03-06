import { Link } from "react-router";
import type { CreditScoreFactors } from "@/lib/types";

interface CreditScoreGaugeProps {
  score: CreditScoreFactors | null;
  merchantId: string | null;
}

const ratingColor: Record<string, string> = {
  Excellent: "text-green-600",
  Good: "text-[var(--primary)]",
  Fair: "text-amber-600",
  Building: "text-[var(--muted-foreground)]",
};

export function CreditScoreGauge({ score, merchantId }: CreditScoreGaugeProps) {
  if (!score) {
    return (
      <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
        <div className="text-sm font-semibold">Credit score</div>
        <p className="mt-2 text-sm text-(--text-secondary)">No data yet.</p>
      </div>
    );
  }

  const pct = Math.round((score.overall_score - 300) / 5.5); // 300-850 -> ~0-100

  return (
    <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="truncate text-sm font-semibold">Credit score</span>
        {merchantId && (
          <Link to={`/credit-score/${merchantId}`} className="shrink-0 text-sm text-(--green-400) hover:underline">
            Details
          </Link>
        )}
      </div>
      <div className="mt-4 flex min-w-0 items-center gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-(--border)"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-(--green-500)"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-(--text-primary)">
            {score.overall_score}
          </span>
        </div>
        <div className="min-w-0">
          <p className={`truncate text-lg font-semibold ${ratingColor[score.rating] ?? ""}`}>{score.rating}</p>
          <p className="mt-0.5 text-xs text-(--text-tertiary)">300–850 scale</p>
        </div>
      </div>
    </div>
  );
}
