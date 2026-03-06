import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import type { Merchant } from "@/lib/types";
import { User } from "lucide-react";

interface MerchantCardProps {
  merchant: Merchant;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  return (
    <div className="rounded-xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-(--border) bg-(--bg-tertiary) text-(--text-secondary)">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-(--text-primary)">{merchant.name || merchant.phone}</p>
          <p className="truncate text-sm text-(--text-secondary)">{merchant.phone}</p>
          {merchant.business_type && (
            <p className="mt-0.5 truncate text-xs text-(--text-tertiary)">{merchant.business_type}</p>
          )}
        </div>
      </div>
      <Link to={`/merchant/${merchant.id}`} className="mt-4 block">
        <Button variant="outline" size="sm">View dashboard</Button>
      </Link>
    </div>
  );
}
