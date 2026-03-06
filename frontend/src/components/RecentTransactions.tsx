import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatRelative } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { Link } from "react-router";

interface RecentTransactionsProps {
  transactions: Transaction[];
  merchantId?: string;
}

const typeLabels: Record<string, string> = {
  sale: "Sale",
  expense: "Expense",
  purchase: "Purchase",
  payment_received: "Payment",
};

export function RecentTransactions({ transactions, merchantId }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Recent Transactions</CardTitle>
        {merchantId ? (
          <Link to={"/transactions?merchant=" + merchantId}>
            <span className="text-sm text-[var(--primary)] hover:underline">View all</span>
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No transactions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Item / Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 10).map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Badge variant={t.type === "sale" || t.type === "payment_received" ? "success" : "secondary"}>
                      {typeLabels[t.type] ?? t.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.item || t.customer_name || "—"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(t.total_amount)}</TableCell>
                  <TableCell className="text-[var(--muted-foreground)]">{formatRelative(t.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
