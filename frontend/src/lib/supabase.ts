import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function subscribeToTransactions(
  merchantId: string,
  callback: (payload: unknown) => void
): { unsubscribe: () => void } {
  if (!supabase) return { unsubscribe: () => {} };
  const channel = supabase
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
  return {
    unsubscribe: () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    },
  };
}
