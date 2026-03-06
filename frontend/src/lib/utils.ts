import numeral from "numeral";
import { format, formatDistanceToNow } from "date-fns";

const NGN = "₦";

export function formatCurrency(amount: number): string {
  return `${NGN}${numeral(amount).format("0,0")}`;
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) return `${NGN}${numeral(amount).format("0.0a").toUpperCase()}`;
  if (amount >= 1_000) return `${NGN}${numeral(amount).format("0.0a").toUpperCase()}`;
  return `${NGN}${numeral(amount).format("0,0")}`;
}

export function formatDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "MMM d, HH:mm");
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
