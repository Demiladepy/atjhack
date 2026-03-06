import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export function subscribeToTransactions(
  merchantId: string,
  callback: (payload: unknown) => void
) {
  return supabase
    .channel("transactions-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "transactions",
        filter: `merchant_id=eq.${merchantId}`,
      },
      callback
    )
    .subscribe();
}
