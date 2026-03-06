import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";

import type { Transaction } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, cn } from "@/lib/utils";

type Period = 7 | 30 | 90;

type Point = {
  date: string; // yyyy-mm-dd
  label: string;
  sales: number;
  expenses: number;
};

function buildSeries(transactions: Transaction[], periodDays: Period): Point[] {
  const since = subDays(new Date(), periodDays - 1);
  const byDay: Record<string, { sales: number; expenses: number }> = {};

  for (const t of transactions) {
    const d = (t.created_at || "").slice(0, 10);
    if (!d) continue;
    const dt = new Date(d);
    if (dt < since) continue;
    if (!byDay[d]) byDay[d] = { sales: 0, expenses: 0 };

    const amt = Number(t.total_amount) || 0;
    if (t.type === "sale") byDay[d].sales += amt;
    if (t.type === "expense" || t.type === "purchase") byDay[d].expenses += amt;
  }

  // Ensure empty days render as 0 so the area chart looks continuous.
  const points: Point[] = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    const v = byDay[day] ?? { sales: 0, expenses: 0 };
    points.push({
      date: day,
      label: format(parseISO(day), "MMM d"),
      sales: v.sales,
      expenses: v.expenses,
    });
  }
  return points;
}

function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point } & { dataKey?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-(--border) bg-zinc-900/95 p-3 shadow-(--shadow-lg) backdrop-blur">
      <div className="text-xs text-zinc-400">{format(parseISO(p.date), "EEE, MMM d")}</div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-(--green-400)" />
            <span>Sales</span>
          </div>
          <div className="font-mono text-xs text-zinc-100">{formatCurrency(p.sales)}</div>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-(--red-400)" />
            <span>Expenses</span>
          </div>
          <div className="font-mono text-xs text-zinc-100">{formatCurrency(p.expenses)}</div>
        </div>
      </div>
    </div>
  );
}

export function RevenueExpensesChart({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState<Period>(90);
  const data = useMemo(() => buildSeries(transactions, period), [transactions, period]);

  const totalSales = useMemo(
    () => data.reduce((s, p) => s + p.sales, 0),
    [data]
  );
  const totalExpenses = useMemo(
    () => data.reduce((s, p) => s + p.expenses, 0),
    [data]
  );

  return (
    <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Revenue vs Expenses</div>
          <div className="mt-1 text-sm text-(--text-secondary)">
            Last {period} days ·{" "}
            <span className="font-mono text-(--green-400)">{formatCurrencyCompact(totalSales)}</span>{" "}
            <span className="text-(--text-tertiary)">sales</span>{" "}
            <span className="text-(--text-tertiary)">/</span>{" "}
            <span className="font-mono text-(--red-400)">{formatCurrencyCompact(totalExpenses)}</span>{" "}
            <span className="text-(--text-tertiary)">expenses</span>
          </div>
        </div>

        <div className="inline-flex w-fit items-center rounded-xl border border-(--border) bg-(--bg-tertiary) p-1">
          {([7, 30, 90] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                period === p
                  ? "bg-(--bg-secondary) text-(--text-primary) shadow-(--shadow-sm)"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              )}
            >
              {p}D
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green-500)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--green-500)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--red-500)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--red-500)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-(--border)"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval={period === 90 ? 6 : period === 30 ? 3 : 1}
            />
            <YAxis
              tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1e6 ? `${Math.round(v / 1e6)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : String(v)
              }
            />
            <Tooltip content={<TooltipContent />} />

            <Area
              type="monotone"
              dataKey="sales"
              stroke="var(--green-400)"
              strokeWidth={2}
              fill="url(#salesFill)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="var(--red-400)"
              strokeWidth={1.5}
              fill="url(#expFill)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

