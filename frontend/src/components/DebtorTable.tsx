import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelative } from "@/lib/utils";
import type { Debt } from "@/lib/types";

interface DebtorTableProps {
  debts: Debt[];
}

export function DebtorTable({ debts }: DebtorTableProps) {
  const sorted = [...debts].sort(
    (a, b) => Number(b.total_owed) - Number(a.total_owed)
  );
  const total = sorted.reduce((s, d) => s + Number(d.total_owed || 0), 0);

  function statusFor(d: Debt): "active" | "overdue" | "settled" {
    if (d.status === "settled") return "settled";
    if (d.status === "overdue") return "overdue";
    const last = d.last_transaction_at ? new Date(d.last_transaction_at) : null;
    if (last && Date.now() - last.getTime() > 1000 * 60 * 60 * 24 * 30) {
      return "overdue";
    }
    return "active";
  }

  return (
    <Card className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] shadow-(--shadow-sm) backdrop-blur">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle>Outstanding Debts</CardTitle>
          <div className="mt-1 text-sm text-(--text-secondary)">
            Biggest debtors first.
          </div>
        </div>
        <Badge
          variant="warning"
          className="shrink-0 border border-(--border) bg-[rgba(245,158,11,0.12)] font-mono text-(--amber-400)"
        >
          Total {formatCurrency(total)}
        </Badge>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-(--border) bg-(--bg-tertiary)/40 p-6 text-center">
            <div className="text-sm font-semibold">No outstanding debts</div>
            <div className="mt-1 text-sm text-(--text-secondary)">
              Credit sales will show up here automatically.
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount Owed</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((d) => {
                const st = statusFor(d);
                const badgeVariant =
                  st === "overdue"
                    ? "warning"
                    : st === "settled"
                      ? "secondary"
                      : "outline";

                return (
                  <TableRow key={d.id}>
                    <TableCell className="max-w-[180px] truncate text-sm font-medium text-(--text-primary)" title={d.customer_name}>
                      {d.customer_name}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-(--amber-400)">
                      {formatCurrency(Number(d.total_owed) || 0)}
                    </TableCell>
                    <TableCell className="text-xs text-(--text-secondary)">
                      {d.last_transaction_at
                        ? formatRelative(d.last_transaction_at)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={badgeVariant as any}
                        className={
                          st === "overdue"
                            ? "bg-[rgba(239,68,68,0.10)] text-(--red-400)"
                            : st === "active"
                              ? "bg-[rgba(245,158,11,0.10)] text-(--amber-400)"
                              : "bg-(--bg-tertiary) text-(--text-secondary)"
                        }
                      >
                        {st === "overdue"
                          ? "Overdue"
                          : st === "settled"
                            ? "Settled"
                            : "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow className="border-t border-(--border)">
                <TableCell className="text-sm font-semibold">TOTAL</TableCell>
                <TableCell className="text-right font-mono font-semibold text-(--amber-400)">
                  {formatCurrency(total)}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
