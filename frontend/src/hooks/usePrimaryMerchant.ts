import { useQuery } from "@tanstack/react-query";
import { fetchMerchants } from "@/lib/api";
import type { Merchant } from "@/lib/types";
import { DEMO_MERCHANT } from "@/lib/demoSeed";

export function usePrimaryMerchant(): { merchant: Merchant | null; isDemo: boolean } {
  const { data, isError } = useQuery({
    queryKey: ["merchants"],
    queryFn: fetchMerchants,
  });

  const list = (data ?? []) as Merchant[];
  if (!isError && list.length > 0) {
    return { merchant: list[0], isDemo: false };
  }

  // Fallback demo merchant so the UI doesn’t look empty in hackathon settings.
  return { merchant: DEMO_MERCHANT, isDemo: true };
}

