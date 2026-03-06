import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ChevronLeft, Search } from "lucide-react";

import { fetchTransactions } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatRelative, cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { usePrimaryMerchant } from "@/hooks/usePrimaryMerchant";
import { DEMO_STATS } from "@/lib/demoSeed";

const typeLabels: Record<string, string> = {
  sale: "Sale",
  expense: "Expense",
  purchase: "Purchase",
  payment_received: "Payment",
};

export default function Transactions() {
  const { merchant, isDemo } = usePrimaryMerchant();
  const merchantId = merchant?.id ?? null;

  const [days, setDays] = useState<7 | 30 | 90>(90);
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", merchantId, days],
    queryFn: () => fetchTransactions(merchantId!, { limit: 500, days }),
    enabled: !!merchantId && !isDemo,
  });

  const list = (isDemo ? DEMO_STATS.monthly : (transactions as Transaction[])) ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list
      .filter((t) => (type === "all" ? true : t.type === type))
      .filter((t) => (status === "all" ? true : t.payment_status === status))
      .filter((t) => {
        if (!needle) return true;
        const hay = [
          t.item,
          t.customer_name,
          t.raw_message,
          typeLabels[t.type] ?? t.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [list, q, status, type]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleExpanded(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Transaction History</h1>
          <p className="mt-1 text-sm text-(--text-secondary)">
            Search, filter, and inspect the WhatsApp messages behind each entry.
          </p>
        </div>
        <Link to="/dashboard" className="shrink-0">
          <Button variant="outline" className="w-fit gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </header>

      <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-4 shadow-(--shadow-sm) backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-tertiary)" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search item, customer, or raw WhatsApp message…"
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg-tertiary)/40 pl-10 pr-3 text-sm text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--border-hover)"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg-tertiary)/40 px-3 text-sm text-(--text-primary) outline-none focus:border-(--border-hover)"
            >
              <option value="all">All types</option>
              <option value="sale">Sales</option>
              <option value="expense">Expenses</option>
              <option value="purchase">Purchases</option>
              <option value="payment_received">Payments</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg-tertiary)/40 px-3 text-sm text-(--text-primary) outline-none focus:border-(--border-hover)"
            >
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="credit">Credit</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={days}
              onChange={(e) => {
                setDays(Number(e.target.value) as 7 | 30 | 90);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-(--border) bg-(--bg-tertiary)/40 px-3 text-sm text-(--text-primary) outline-none focus:border-(--border-hover)"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-2 shadow-(--shadow-sm) backdrop-blur">
        {isLoading ? (
          <div className="p-6 text-sm text-(--text-secondary)">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-(--text-secondary)">
            No matching transactions.
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-(--border)">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((t) => {
                const isIncome = t.type === "sale" || t.type === "payment_received";
                const amountClass = isIncome ? "text-(--green-400)" : "text-(--red-400)";
                const badgeVariant =
                  t.type === "sale"
                    ? "success"
                    : t.type === "payment_received"
                      ? "default"
                      : "secondary";
                const expanded = expandedId === t.id;
                return (
                  <Fragment key={t.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer border-0 hover:bg-(--bg-tertiary)/40",
                        expanded && "bg-(--bg-tertiary)/30"
                      )}
                      onClick={() => toggleExpanded(t.id)}
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        <div className="text-(--text-primary)">{formatDateTime(t.created_at)}</div>
                        <div className="text-xs text-(--text-secondary)">{formatRelative(t.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant as any}>
                          {typeLabels[t.type] ?? t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] min-w-0 truncate text-sm text-(--text-primary)" title={t.item || undefined}>
                        {t.item || "—"}
                      </TableCell>
                      <TableCell className="max-w-[160px] min-w-0 truncate text-sm text-(--text-secondary)" title={t.customer_name || undefined}>
                        {t.customer_name || "—"}
                      </TableCell>
                      <TableCell className={cn("text-right font-mono text-sm", amountClass)}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(Number(t.total_amount) || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.payment_status === "credit"
                              ? "warning"
                              : t.payment_status === "paid"
                                ? "success"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {t.payment_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expanded ? (
                      <TableRow className="border-0">
                        <TableCell colSpan={6} className="pb-4 pt-0">
                          <div className="mt-2 rounded-xl border border-(--border) bg-(--bg-tertiary)/30 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
                              WhatsApp message
                            </div>
                            <div className="mt-2 whitespace-pre-wrap font-mono text-sm text-(--text-primary)">
                              {t.raw_message || "—"}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-(--text-secondary) font-mono">
          {filtered.length} transactions
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            Prev
          </Button>
          <div className="text-xs text-(--text-secondary) font-mono">
            Page {safePage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
