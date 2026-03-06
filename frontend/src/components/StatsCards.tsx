import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyCompact } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

interface StatsCardsProps {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  outstandingDebts: number;
  trends?: Partial<{
    totalSalesPct: number;
    totalExpensesPct: number;
    netProfitPct: number;
    outstandingDebtsPct: number;
  }>;
}

export function StatsCards({
  totalSales,
  totalExpenses,
  netProfit,
  outstandingDebts,
  trends,
}: StatsCardsProps) {
  const salesV = useCountUp(totalSales, 1200);
  const expV = useCountUp(totalExpenses, 1200);
  const profitV = useCountUp(netProfit, 1200);
  const debtV = useCountUp(outstandingDebts, 1200);

  const items = [
    {
      label: "Revenue",
      value: salesV,
      color: "text-(--green-400)",
      icon: TrendingUp,
      trend: trends?.totalSalesPct,
      glow: true,
    },
    {
      label: "Expenses",
      value: expV,
      color: "text-(--red-400)",
      icon: TrendingDown,
      trend: trends?.totalExpensesPct,
    },
    {
      label: "Profit",
      value: profitV,
      color: "text-(--green-400)",
      icon: Wallet,
      trend: trends?.netProfitPct,
    },
    {
      label: "Debts",
      value: debtV,
      color: "text-(--amber-400)",
      icon: AlertCircle,
      trend: trends?.outstandingDebtsPct,
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((it, idx) => {
        const Icon = it.icon;
        const trend = typeof it.trend === "number" ? it.trend : null;
        const trendPositive = trend !== null ? trend >= 0 : null;

        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: idx * 0.05, ease: "easeOut" }}
          >
            <Card
              className={[
                "rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] shadow-(--shadow-sm) backdrop-blur",
                "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md)",
                it.glow ? "shadow-(--shadow-glow-green)" : "",
              ].join(" ")}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wider text-(--text-secondary)">
                      {it.label}
                    </div>
                    <div className={`mt-2 truncate font-mono text-3xl font-semibold ${it.color}`}>
                      {formatCurrencyCompact(Math.max(0, it.value))}
                    </div>
                  </div>

                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-(--border) bg-(--bg-tertiary)">
                    <Icon
                      className={
                        it.label === "Expenses"
                          ? "h-4 w-4 text-(--red-400)"
                          : "h-4 w-4 text-(--green-400)"
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-(--text-secondary)">This week</div>
                  {trend !== null ? (
                    <div
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px]",
                        trendPositive
                          ? "bg-[rgba(34,197,94,0.12)] text-(--green-400)"
                          : "bg-[rgba(239,68,68,0.12)] text-(--red-400)",
                      ].join(" ")}
                    >
                      <span>{trendPositive ? "+" : ""}{Math.round(trend)}%</span>
                      <span className="text-[10px] opacity-80">vs last</span>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-(--text-tertiary)">—</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
