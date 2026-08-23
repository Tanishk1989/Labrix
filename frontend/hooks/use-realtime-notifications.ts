"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { NotificationEvent } from "@/lib/notification-bus";

const PUBLIC_PATHS = [
  "/",
  "/sign-in",
  "/sign-up",
  "/unauthorized",
  "/unlinked-account",
  "/disabled-account",
];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Hook that opens an SSE connection to /api/notifications and
 * calls `onEvent` whenever a real-time notification arrives.
 *
 * Excludes unauthenticated public pages.
 * Automatically reconnects on network drop with exponential backoff (max 30s).
 */
export function useRealtimeNotifications(
  onEvent: (event: NotificationEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  const pathname = usePathname();

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // Do not open notification streams on public/auth pages
    if (isPublicPath(pathname)) {
      return;
    }

    let es: EventSource | null = null;
    let retryDelay = 1_000; // start at 1s
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      es = new EventSource("/api/notifications");

      es.onopen = () => {
        retryDelay = 1_000; // reset backoff on successful connection
      };

      es.onmessage = (e) => {
        try {
          const event: NotificationEvent = JSON.parse(e.data as string);
          onEventRef.current(event);
        } catch {
          // Malformed event — ignore
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (!destroyed) {
          setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 30_000); // cap at 30s
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      es?.close();
    };
  }, [pathname]);
}
