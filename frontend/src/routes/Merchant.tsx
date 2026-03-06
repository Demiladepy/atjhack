import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMerchant, fetchCreditScore } from "@/lib/api";
import { StatsCards } from "@/components/StatsCards";
import { SalesChart, aggregateSalesByDay } from "@/components/charts/SalesChart";
import { ProfitTrend, aggregateProfitByDay } from "@/components/charts/ProfitTrend";
import { CategoryBreakdown, aggregateByCategory } from "@/components/charts/CategoryBreakdown";
import { RecentTransactions } from "@/components/RecentTransactions";
import { DebtorTable } from "@/components/DebtorTable";
import { CreditScoreGauge } from "@/components/CreditScoreGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Merchant() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["merchant", id],
    queryFn: () => fetchMerchant(id!),
    enabled: !!id,
  });

  const { data: creditScore } = useQuery({
    queryKey: ["credit-score", id],
    queryFn: () => fetchCreditScore(id!),
    enabled: !!id,
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      </div>
    );
  }
  if (error || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Merchant not found.</p>
        <Link to="/"><Button variant="outline" className="ml-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const merchant = data.merchant as { id: string; name: string | null; phone: string };
  const stats = data.stats;
  const weekly = (stats.weekly ?? []) as { total_amount: number; type: string; created_at: string }[];
  const monthly = (stats.monthly ?? []) as { total_amount: number; type: string; created_at: string; category: string | null }[];
  const debts = (stats.debts ?? []) as { id: string; customer_name: string; total_owed: number }[];
  const transactions = (stats.weekly ?? []) as { id: string; type: string; item: string | null; customer_name: string | null; total_amount: number; created_at: string }[];

  const totalSales = weekly.filter((t) => t.type === "sale").reduce((s, t) => s + Number(t.total_amount), 0);
  const totalExpenses = weekly
    .filter((t) => t.type === "expense" || t.type === "purchase")
    .reduce((s, t) => s + Number(t.total_amount), 0);
  const netProfit = totalSales - totalExpenses;
  const outstandingDebts = debts.reduce((s, d) => s + Number(d.total_owed), 0);

  const salesChartData = aggregateSalesByDay(monthly);
  const profitTrendData = aggregateProfitByDay(monthly);
  const categoryData = aggregateByCategory(monthly);

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/"><Button variant="outline" size="sm">Back</Button></Link>
          <h1 className="text-2xl font-bold">{merchant.name || merchant.phone}</h1>
        </div>
      </header>

      <div className="space-y-6">
        <StatsCards
          totalSales={totalSales}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
          outstandingDebts={outstandingDebts}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sales trend</CardTitle>
            </CardHeader>
            <CardContent>
              {salesChartData.length > 0 ? <SalesChart data={salesChartData} /> : <p className="text-sm text-[var(--muted-foreground)]">No data</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profit trend</CardTitle>
            </CardHeader>
            <CardContent>
              {profitTrendData.length > 0 ? <ProfitTrend data={profitTrendData} /> : <p className="text-sm text-[var(--muted-foreground)]">No data</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales by category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? <CategoryBreakdown data={categoryData} /> : <p className="text-sm text-[var(--muted-foreground)]">No data</p>}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions transactions={transactions} merchantId={id} />
          <DebtorTable debts={debts} />
        </div>

        <CreditScoreGauge score={creditScore ?? null} merchantId={id} />
      </div>
    </div>
  );
}
