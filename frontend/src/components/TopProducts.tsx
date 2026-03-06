import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { Transaction } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/utils";

type ItemPoint = { name: string; value: number };

function buildTop(transactions: Transaction[]): ItemPoint[] {
  const byItem: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "sale") continue;
    const name = (t.item || "").trim();
    if (!name) continue;
    byItem[name] = (byItem[name] ?? 0) + (Number(t.total_amount) || 0);
  }
  return Object.entries(byItem)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function TopProducts({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => buildTop(transactions), [transactions]);

  return (
    <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Top Products</div>
        <div className="text-xs text-(--text-secondary)">by revenue</div>
      </div>

      <div className="mt-4 h-[220px] w-full">
        {data.length === 0 ? (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-(--border) bg-(--bg-tertiary)/40 p-6 text-center">
            <div>
              <div className="text-sm font-semibold">No sales yet</div>
              <div className="mt-1 text-sm text-(--text-secondary)">
                Top products will appear once sales are recorded.
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 6, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Bar
                dataKey="value"
                fill="var(--green-500)"
                radius={[0, 8, 8, 0]}
                animationDuration={1200}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {data.length ? (
        <div className="mt-4 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <span className="truncate text-(--text-secondary)">{d.name}</span>
              <span className="font-mono text-(--text-primary)">
                {formatCurrencyCompact(d.value)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

