import { useQuery } from "@tanstack/react-query";
import { fetchMerchant, fetchCreditScore } from "@/lib/api";
import { StatsCards } from "@/components/StatsCards";
import { RevenueExpensesChart } from "@/components/charts/RevenueExpensesChart";
import { RecentActivity } from "@/components/RecentActivity";
import { DebtorTable } from "@/components/DebtorTable";
import { TopProducts } from "@/components/TopProducts";
import { CreditScoreGauge } from "@/components/CreditScoreGauge";
import { LiveIndicator } from "@/components/layout/LiveIndicator";
import { usePrimaryMerchant } from "@/hooks/usePrimaryMerchant";
import { DEMO_STATS } from "@/lib/demoSeed";
import type { Transaction } from "@/lib/types";

export default function Dashboard() {
  const { merchant, isDemo } = usePrimaryMerchant();
  const merchantId = merchant?.id ?? null;

  const { data: merchantData, isLoading: loadingMerchant } = useQuery({
    queryKey: ["merchant", merchantId],
    queryFn: () => fetchMerchant(merchantId!),
    enabled: !!merchantId && !isDemo,
  });

  const { data: creditScore } = useQuery({
    queryKey: ["credit-score", merchantId],
    queryFn: () => fetchCreditScore(merchantId!),
    enabled: !!merchantId && !isDemo,
  });

  const stats = isDemo ? DEMO_STATS : merchantData?.stats;
  const weekly = (stats?.weekly ?? []) as Transaction[];
  const monthly = (stats?.monthly ?? []) as Transaction[];
  const debts = (stats?.debts ?? []) as any[];

  const totalSales = weekly
    .filter((t) => t.type === "sale")
    .reduce((s, t) => s + Number(t.total_amount), 0);
  const totalExpenses = weekly
    .filter((t) => t.type === "expense" || t.type === "purchase")
    .reduce((s, t) => s + Number(t.total_amount), 0);
  const netProfit = totalSales - totalExpenses;
  const outstandingDebts = debts.reduce((s, d) => s + Number(d.total_owed || 0), 0);

  const effectiveCreditScore = isDemo ? DEMO_STATS.creditScore : creditScore ?? null;

  // Trend vs previous 7 days (using last 14 days from monthly)
  const trends = (() => {
    const now = Date.now();
    const last7 = monthly.filter(
      (t) => now - new Date(t.created_at).getTime() <= 1000 * 60 * 60 * 24 * 7
    );
    const prev7 = monthly.filter((t) => {
      const age = now - new Date(t.created_at).getTime();
      return age > 1000 * 60 * 60 * 24 * 7 && age <= 1000 * 60 * 60 * 24 * 14;
    });
    const sumSales = (arr: Transaction[]) =>
      arr
        .filter((t) => t.type === "sale")
        .reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const sumExp = (arr: Transaction[]) =>
      arr
        .filter((t) => t.type === "expense" || t.type === "purchase")
        .reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const curSales = sumSales(last7);
    const curExp = sumExp(last7);
    const curProfit = curSales - curExp;
    const prevSales = sumSales(prev7);
    const prevExp = sumExp(prev7);
    const prevProfit = prevSales - prevExp;
    const pct = (cur: number, prev: number) =>
      prev === 0 ? null : ((cur - prev) / prev) * 100;
    return {
      totalSalesPct: pct(curSales, prevSales) ?? undefined,
      totalExpensesPct: pct(curExp, prevExp) ?? undefined,
      netProfitPct: pct(curProfit, prevProfit) ?? undefined,
    };
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 truncate text-sm text-(--text-secondary)">
            {merchant?.name ?? "Merchant"}
            <span className="text-(--text-tertiary)"> · {merchant?.location ?? "Location"}</span>
          </p>
        </div>
        <div className="shrink-0">
          <LiveIndicator />
        </div>
      </header>

      {loadingMerchant && !isDemo ? (
        <div className="rounded-xl border border-(--border) bg-(--bg-secondary)/60 p-6 text-sm text-(--text-secondary)">
          Loading dashboard…
        </div>
      ) : (
        <div className="space-y-6">
          <StatsCards
            totalSales={totalSales}
            totalExpenses={totalExpenses}
            netProfit={netProfit}
            outstandingDebts={outstandingDebts}
            trends={trends}
          />

          <RevenueExpensesChart transactions={monthly} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivity merchantId={isDemo ? "" : (merchantId ?? "")} initial={weekly} />
            <DebtorTable debts={debts as any} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopProducts transactions={monthly} />
            <CreditScoreGauge score={effectiveCreditScore} merchantId={merchantId} />
          </div>
        </div>
      )}
    </div>
  );
}
