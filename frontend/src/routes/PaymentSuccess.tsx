import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyPayment } from "@/lib/api";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference.");
      return;
    }
    let cancelled = false;
    verifyPayment(reference)
      .then((data) => {
        if (cancelled) return;
        if (data.verified) {
          setStatus("success");
          setMessage(`Payment of ₦${(data.amount || 0).toLocaleString()} confirmed.`);
        } else {
          setStatus("failed");
          setMessage("Payment could not be verified.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("failed");
          setMessage("Verification failed. Your payment may still have gone through.");
        }
      });
    return () => { cancelled = true; };
  }, [reference]);

  const merchantId = status === "success" ? undefined : null; // could read from verify response metadata to redirect to credit-score

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {status === "loading" && (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-(--green-400)" />
          <p className="mt-4 text-(--text-secondary)">Verifying payment…</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="grid h-20 w-20 place-items-center rounded-full bg-(--green-500)/20">
            <CheckCircle2 className="h-10 w-10 text-(--green-400)" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-(--text-primary)">You’re on Pro</h1>
          <p className="mt-2 text-center text-(--text-secondary)">{message}</p>
          <p className="mt-2 text-center text-sm text-(--text-tertiary)">
            Your credit score and financial health profile are now unlocked.
          </p>
          <Button
            className="mt-8"
            onClick={() => navigate(merchantId ? `/credit-score/${merchantId}` : "/")}
          >
            Go to Dashboard
          </Button>
        </>
      )}
      {status === "failed" && (
        <>
          <p className="text-(--red-400)">{message}</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </>
      )}
    </div>
  );
}
