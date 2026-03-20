import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  Activity
} from "lucide-react";

import type { Transaction } from "@/lib/types";
import { formatCurrency, formatRelative, cn } from "@/lib/utils";
import { subscribeToTransactions } from "@/lib/supabase";

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
        iconBg: "bg-(--green-500)/20",
        iconFg: "text-(--green-400)",
        amountFg: "text-(--green-400)",
        prefix: "+",
        flash: "rgba(74,222,128,0.15)",
      };
    case "expense":
    case "purchase":
      return {
        label: t === "purchase" ? "Purchase" : "Expense",
        icon: ArrowDownLeft,
        iconBg: "bg-red-500/20",
        iconFg: "text-red-400",
        amountFg: "text-red-400",
        prefix: "-",
        flash: "rgba(248,113,113,0.15)",
      };
    case "payment_received":
      return {
        label: "Payment",
        icon: CheckCircle2,
        iconBg: "bg-blue-500/20",
        iconFg: "text-blue-400",
        amountFg: "text-blue-400",
        prefix: "+",
        flash: "rgba(96,165,250,0.15)",
      };
    default:
      return {
        label: "Activity",
        icon: Clock,
        iconBg: "bg-amber-500/20",
        iconFg: "text-amber-400",
        amountFg: "text-amber-400",
        prefix: "",
        flash: "rgba(251,191,36,0.15)",
      };
  }
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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-(--text-secondary)" />
            <span className="text-base font-bold tracking-wide text-white">Live Transactions</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 backdrop-blur-md">
          <span className={cn("h-2 w-2 rounded-full", configured ? "bg-(--green-500) shadow-[0_0_8px_var(--green-500)] liveDot" : "bg-red-500 shadow-[0_0_8px_#ef4444]")} />
          <span className={cn("text-[10px] font-bold tracking-widest", configured ? "text-(--green-400)" : "text-red-400")}>
            {configured ? "LIVE SYNC" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="space-y-[2px]">
        {txns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <Clock className="mb-3 h-8 w-8 text-white/20" />
            <div className="text-sm font-semibold text-white/80">Awaiting your first text</div>
            <div className="mt-1 text-xs text-white/50 max-w-[200px]">
              Send a sale via WhatsApp to see the AI magic happen.
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {txns.map((t) => {
              const meta = typeMeta(t.type);
              const Icon = meta.icon;
              const bg = t.isNew ? meta.flash : "transparent";
              const item = t.item?.trim() || t.customer_name?.trim() || "Transaction";
              
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -20, rotateX: 20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, backgroundColor: bg }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  layout
                  className="group/item relative flex items-center justify-between overflow-hidden rounded-xl p-3 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/5 shadow-inner transition-transform group-hover/item:scale-110", meta.iconBg)}>
                      <Icon className={cn("h-4 w-4", meta.iconFg)} />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-white/90 truncate max-w-[180px] sm:max-w-[240px]">
                        {item}
                      </div>
                      <div className="text-xs font-medium text-white/40">
                        {formatRelative(t.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className={cn("shrink-0 font-mono text-base font-bold drop-shadow-sm", meta.amountFg)}>
                    {meta.prefix}
                    {formatCurrency(Number(t.total_amount) || 0)}
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

