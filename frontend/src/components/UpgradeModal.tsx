import { useState } from "react";
import { X, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initializePayment } from "@/lib/api";
import { cn } from "@/lib/utils";

const PRO_FEATURES = [
  "Credit Score & Financial Health Profile",
  "Monthly PDF reports (exportable)",
  '"Loan Ready" badge for microfinance referral',
  "Priority support",
];

interface UpgradeModalProps {
  merchantId: string;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({
  merchantId,
  onClose,
  onSuccess,
  title = "Unlock your Financial Health Profile",
  description = "Upgrade to Pro to see your credit score and microloan eligibility.",
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(plan: "pro_monthly" | "pro_yearly") {
    setError(null);
    setLoading(true);
    try {
      const { authorization_url } = await initializePayment(merchantId, plan);
      window.location.href = authorization_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment could not be started.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-(--border) bg-(--bg-secondary) p-6 shadow-(--shadow-lg)",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-(--green-500)/15">
              <Zap className="h-6 w-6 text-(--green-400)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--text-primary)">{title}</h2>
              <p className="mt-0.5 text-sm text-(--text-secondary)">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-(--text-tertiary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-(--text-secondary)">
              <Check className="h-4 w-4 shrink-0 text-(--green-400)" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3">
          <Button
            className="w-full bg-(--green-600) hover:bg-(--green-500) font-semibold"
            disabled={loading}
            onClick={() => handleSubscribe("pro_monthly")}
          >
            {loading ? "Redirecting…" : "Subscribe — ₦2,000/month"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-(--border) text-(--text-secondary)"
            disabled={loading}
            onClick={() => handleSubscribe("pro_yearly")}
          >
            Save 17% — ₦20,000/year
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-(--red-400)">{error}</p>
        )}

        <p className="mt-4 text-center text-xs text-(--text-tertiary)">
          Secure payment via Paystack. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
