import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
} from "lucide-react";

import type { Transaction } from "@/lib/types";
import { formatCurrency, formatRelative, cn } from "@/lib/utils";
import { subscribeToTransactions, supabase } from "@/lib/supabase";

type TxnWithNew = Transaction & { isNew?: boolean };

function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? "";
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  return Boolean(url && key && !url.includes("your-project.supabase.co") && !key.includes("your_anon_key"));
}

function typeMeta(t: Transaction["type"]) {
  switch (t) {
    case "sale":
      return {
        label: "Sale",
        icon: ArrowUpRight,
        iconBg: "bg-[rgba(34,197,94,0.15)]",
        iconFg: "text-[var(--green-400)]",
        amountFg: "text-[var(--green-400)]",
        prefix: "+",
        flash: "rgba(34,197,94,0.10)",
      };
    case "expense":
    case "purchase":
      return {
        label: t === "purchase" ? "Purchase" : "Expense",
        icon: ArrowDownLeft,
        iconBg: "bg-[rgba(239,68,68,0.12)]",
        iconFg: "text-[var(--red-400)]",
        amountFg: "text-[var(--red-400)]",
        prefix: "-",
        flash: "rgba(239,68,68,0.10)",
      };
    case "payment_received":
      return {
        label: "Payment",
        icon: CheckCircle2,
        iconBg: "bg-[rgba(59,130,246,0.12)]",
        iconFg: "text-[var(--blue-500)]",
        amountFg: "text-[var(--blue-500)]",
        prefix: "+",
        flash: "rgba(59,130,246,0.10)",
      };
    default:
      return {
        label: "Activity",
        icon: Clock,
        iconBg: "bg-[rgba(245,158,11,0.12)]",
        iconFg: "text-[var(--amber-400)]",
        amountFg: "text-[var(--amber-400)]",
        prefix: "",
        flash: "rgba(245,158,11,0.10)",
      };
  }
}

function describe(t: Transaction) {
  const item = t.item?.trim();
  const customer = t.customer_name?.trim();
  if (t.type === "sale" && item && customer) return `${item} to ${customer}`;
  if (t.type === "sale" && item) return `${item} sold`;
  if ((t.type === "expense" || t.type === "purchase") && item) return item;
  if (t.type === "payment_received" && customer) return `Payment from ${customer}`;
  return item || customer || "Transaction";
}

export function RecentActivity({
  merchantId,
  initial,
  maxItems = 8,
}: {
  merchantId: string;
  initial: Transaction[];
  maxItems?: number;
}) {
  const [txns, setTxns] = useState<TxnWithNew[]>(() =>
    (initial ?? []).slice(0, maxItems)
  );

  const configured = useMemo(() => isSupabaseConfigured(), []);

  useEffect(() => {
    setTxns((initial ?? []).slice(0, maxItems));
  }, [initial, maxItems]);

  useEffect(() => {
    if (!configured || !merchantId) return;

    const channel = subscribeToTransactions(merchantId, (payload: any) => {
      const t = payload?.new as Transaction | undefined;
      if (!t?.id) return;

      setTxns((prev) => [{ ...t, isNew: true }, ...prev].slice(0, maxItems));
      window.setTimeout(() => {
        setTxns((prev) => prev.map((x) => (x.id === t.id ? { ...x, isNew: false } : x)));
      }, 3000);
    });

    return () => channel.unsubscribe();
  }, [configured, merchantId, maxItems]);

  return (
    <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">Recent Activity</span>
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--bg-tertiary) px-2 py-1">
          <span className={cn("h-2 w-2 rounded-full", configured ? "bg-(--green-500) liveDot" : "bg-(--red-500)")} />
          <span className={cn("text-[10px] font-medium tracking-wider", configured ? "text-(--green-400)" : "text-(--red-400)")}>
            {configured ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {txns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-(--border) bg-(--bg-tertiary)/40 p-6 text-center">
            <div className="text-sm font-semibold">No activity yet</div>
            <div className="mt-1 text-sm text-(--text-secondary)">
              Send a sale or expense via WhatsApp to see it appear here.
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {txns.map((t) => {
              const meta = typeMeta(t.type);
              const Icon = meta.icon;
              const bg = t.isNew ? meta.flash : "transparent";
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1, backgroundColor: bg }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  layout
                  className="rounded-xl px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", meta.iconBg)}>
                        <Icon className={cn("h-4 w-4", meta.iconFg)} />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="truncate text-sm text-(--text-primary)" title={describe(t)}>
                          {describe(t)}
                        </div>
                        <div className="mt-0.5 text-xs text-(--text-secondary)">
                          {formatRelative(t.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className={cn("shrink-0 font-mono text-sm", meta.amountFg)}>
                      {meta.prefix}
                      {formatCurrency(Number(t.total_amount) || 0)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

