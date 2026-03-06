import { useQuery } from "@tanstack/react-query";

import { fetchMerchant } from "@/lib/api";
import { DebtorTable } from "@/components/DebtorTable";
import { usePrimaryMerchant } from "@/hooks/usePrimaryMerchant";
import { DEMO_STATS } from "@/lib/demoSeed";
import type { Debt } from "@/lib/types";

export default function Debtors() {
  const { merchant, isDemo } = usePrimaryMerchant();
  const merchantId = merchant?.id ?? null;

  const { data: merchantData, isLoading } = useQuery({
    queryKey: ["merchant", merchantId],
    queryFn: () => fetchMerchant(merchantId!),
    enabled: !!merchantId && !isDemo,
  });

  const debts = (isDemo ? DEMO_STATS.debts : (merchantData?.stats?.debts ?? [])) as Debt[];

  return (
    <div className="space-y-6">
      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">Debtors</h1>
        <p className="mt-1 text-sm text-(--text-secondary)">
          Outstanding debts and repayment status.
        </p>
      </header>

      {isLoading && !isDemo ? (
        <div className="rounded-xl border border-(--border) bg-(--bg-secondary)/60 p-6 text-sm text-(--text-secondary)">
          Loading…
        </div>
      ) : (
        <DebtorTable debts={debts} />
      )}
    </div>
  );
}

