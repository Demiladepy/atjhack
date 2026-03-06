import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface DayPoint {
  date: string;
  sales: number;
  label: string;
}

interface SalesChartProps {
  data: DayPoint[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  <p className="text-sm text-[var(--primary)]">{formatCurrency(p.sales)}</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function aggregateSalesByDay(transactions: { total_amount: number; created_at: string; type: string }[]): DayPoint[] {
  const byDay: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "sale") continue;
    const d = (t.created_at || "").slice(0, 10);
    if (!d) continue;
    byDay[d] = (byDay[d] ?? 0) + Number(t.total_amount);
  }
  const sorted = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([date, sales]) => ({
    date,
    sales,
    label: format(parseISO(date), "MMM d"),
  }));
}
