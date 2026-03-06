import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CategoryPoint {
  name: string;
  amount: number;
}

interface CategoryBreakdownProps {
  data: CategoryPoint[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border)]" />
          <XAxis
            dataKey="name"
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
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-sm text-[var(--primary)]">{formatCurrency(p.amount)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function aggregateByCategory(
  transactions: { total_amount: number; category: string | null; type: string }[]
): CategoryPoint[] {
  const byCat: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "sale") continue;
    const cat = t.category || "Other";
    byCat[cat] = (byCat[cat] ?? 0) + Number(t.total_amount);
  }
  return Object.entries(byCat)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}
