import { useMemo } from "react";
import { supabase } from "@/lib/supabase";

function isSupabaseConfigured() {
  // supabase-js client will exist even with empty env; detect common “not set” case
  try {
    // @ts-expect-error - not typed on public client
    const url: string | undefined = supabase?.supabaseUrl;
    return Boolean(url && !url.includes("your-project.supabase.co"));
  } catch {
    return false;
  }
}

export function LiveIndicator() {
  const configured = useMemo(() => isSupabaseConfigured(), []);

  // We treat “configured” as “should be live”; actual subscription state is handled
  // in the dashboard feed (where realtime matters). This stays simple + always visible.
  const label = configured ? "Live" : "Reconnecting…";
  const dotColor = configured ? "bg-[var(--green-500)]" : "bg-[var(--red-500)]";

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dotColor} ${configured ? "liveDot" : ""}`} />
      <span className="text-xs font-medium text-[var(--text-secondary)]">
        <span className={configured ? "text-[var(--green-400)]" : "text-[var(--red-400)]"}>
          {label}
        </span>
      </span>
    </div>
  );
}

