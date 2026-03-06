import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendPoint {
  label: string;
  profit: number;
  sales: number;
  expenses: number;
}

interface ProfitTrendProps {
  data: TrendPoint[];
}

export function ProfitTrend({ data }: ProfitTrendProps) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border)]" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : String(v))}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-2 shadow">
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-sm">Profit: {formatCurrency(p.profit)}</p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: "var(--primary)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function aggregateProfitByDay(
  transactions: { total_amount: number; created_at: string; type: string }[]
): TrendPoint[] {
  const byDay: Record<string, { sales: number; expenses: number }> = {};
  for (const t of transactions) {
    const d = (t.created_at || "").slice(0, 10);
    if (!d) continue;
    if (!byDay[d]) byDay[d] = { sales: 0, expenses: 0 };
    const amt = Number(t.total_amount);
    if (t.type === "sale") byDay[d].sales += amt;
    else if (t.type === "expense" || t.type === "purchase") byDay[d].expenses += amt;
  }
  const sorted = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([date, v]) => ({
    label: date.slice(5),
    profit: v.sales - v.expenses,
    sales: v.sales,
    expenses: v.expenses,
  }));
}
