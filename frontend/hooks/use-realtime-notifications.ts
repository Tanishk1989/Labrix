"use client";

import { useEffect, useRef } from "react";
import type { NotificationEvent } from "@/lib/notification-bus";

/**
 * Hook that opens an SSE connection to /api/notifications and
 * calls `onEvent` whenever a real-time notification arrives.
 *
 * Automatically reconnects on disconnect (exponential backoff, max 30s).
 */
export function useRealtimeNotifications(
  onEvent: (event: NotificationEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent; // always latest without re-connecting

  useEffect(() => {
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
  }, []); // only runs once per mount
}
