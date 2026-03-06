import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import type { Merchant } from "@/lib/types";
import { User } from "lucide-react";

interface MerchantCardProps {
  merchant: Merchant;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <User className="h-4 w-4 text-[var(--muted-foreground)]" />
        <span className="font-medium">{merchant.name || merchant.phone}</span>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--muted-foreground)]">{merchant.phone}</p>
        {merchant.business_type && (
          <p className="text-sm mt-1">{merchant.business_type}</p>
        )}
        <Link to={`/merchant/${merchant.id}`} className="mt-3 block">
          <Button variant="outline" size="sm">View dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
