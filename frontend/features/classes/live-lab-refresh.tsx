"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

const REFRESH_INTERVAL_MS = 15_000;

export function LiveLabRefresh() {
  const router = useRouter();
  const [automatic, setAutomatic] = useState(true);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    if (!automatic) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [automatic, refresh]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={automatic}
          onChange={(event) => setAutomatic(event.target.checked)}
          className="size-4 accent-[var(--brand)]"
        />
        Refresh every 15s
      </label>
      <button type="button" className="button-secondary min-h-11" onClick={refresh} disabled={pending}>
        <RefreshCw size={14} className={pending ? "animate-spin" : ""} aria-hidden="true" />
        {pending ? "Refreshing…" : "Refresh now"}
      </button>
    </div>
  );
}
