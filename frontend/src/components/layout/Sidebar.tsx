import { useMemo, useState, type ComponentType } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  BadgePercent,
  ChevronLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LiveIndicator } from "@/components/layout/LiveIndicator";
import { usePrimaryMerchant } from "@/hooks/usePrimaryMerchant";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ListChecks },
  { to: "/debtors", label: "Debtors", icon: Users },
  { to: "/credit-score", label: "Credit Score", icon: BadgePercent },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { merchant, isDemo } = usePrimaryMerchant();

  const activePath = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/transactions")) return "/transactions";
    if (p.startsWith("/debtors")) return "/debtors";
    if (p.startsWith("/credit-score")) return "/credit-score";
    return "/dashboard";
  }, [location.pathname]);

  const displayName = merchant?.name ?? "Mama Nkechi";
  const locationText = merchant?.location ?? "Alaba Market, Lagos";

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 border-r border-(--border) bg-(--bg-secondary)/80 backdrop-blur",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex h-full flex-col px-3 py-4">
        <Link
          to="/"
          className={cn("flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-(--bg-tertiary)/50", collapsed && "justify-center")}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-white p-1 shadow-(--shadow-sm)">
            <img src="/logo.png" alt="SMB Bookkeeper" className="h-full w-full object-contain" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 overflow-hidden">
              <div className="truncate text-sm font-semibold">SMB Bookkeeper</div>
              <div className="truncate text-xs text-(--text-secondary)">Financial Clarity</div>
            </div>
          ) : null}
        </Link>

        <div className="my-3 h-px bg-(--border)" />

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === activePath;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                  "text-zinc-500 hover:bg-(--bg-tertiary)/70 hover:text-zinc-200",
                  isActive &&
                    "border-l-2 border-(--green-500) bg-(--bg-accent) text-(--green-400)"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-(--green-400)" : "text-zinc-500 group-hover:text-zinc-200")} />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 px-2 pb-1">
          <div className={cn("rounded-xl border border-(--border) bg-[rgba(255,255,255,0.02)] p-3", collapsed && "p-2")}>
            <div className={cn("flex min-w-0 items-center gap-3", collapsed && "justify-center")}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-(--bg-tertiary) text-sm font-semibold">
                {initials(displayName || "M")}
              </div>
              {!collapsed ? (
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold">{displayName}</span>
                    {isDemo ? (
                      <span className="shrink-0 inline-flex items-center rounded-full border border-(--border) bg-(--bg-tertiary) px-2 py-0.5 text-[10px] text-(--text-secondary)">
                        Demo
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-xs text-(--text-secondary)">{locationText}</div>
                </div>
              ) : null}
            </div>
            {!collapsed ? (
              <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
                <div className="min-w-0 shrink"><LiveIndicator /></div>
                <button
                  onClick={() => setCollapsed((v) => !v)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--border) bg-(--bg-tertiary) text-(--text-secondary) transition-colors hover:text-(--text-primary)"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-(--border) bg-(--bg-tertiary) py-2 text-(--text-secondary) transition-colors hover:text-(--text-primary)"
                aria-label="Expand sidebar"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

