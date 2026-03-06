import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle>Credit score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">No data yet.</p>
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round((score.overall_score - 300) / 5.5); // 300-850 -> ~0-100

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Credit score</CardTitle>
        {merchantId && (
          <Link to={`/credit-score/${merchantId}`}>
            <span className="text-sm text-[var(--primary)] hover:underline">Details</span>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[var(--muted)]"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--primary)]"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${pct}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
              {score.overall_score}
            </span>
          </div>
          <div>
            <p className={`text-xl font-semibold ${ratingColor[score.rating] ?? ""}`}>{score.rating}</p>
            <p className="text-xs text-[var(--muted-foreground)]">300–850 scale</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
