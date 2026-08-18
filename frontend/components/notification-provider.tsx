"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { X, Zap, CheckCircle2, Bell, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import type { NotificationEvent, NotificationEventType } from "@/lib/notification-bus";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface Toast extends NotificationEvent {
  id: string;
}

interface NotificationContextType {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

const NotificationContext = createContext<NotificationContextType>({
  toasts: [],
  dismiss: () => {},
});

// ------------------------------------------------------------------
// Icon map
// ------------------------------------------------------------------

const ICON_MAP: Record<NotificationEventType, React.ReactNode> = {
  PRACTICAL_PUBLISHED: <Zap size={16} className="text-[var(--color-brand)]" />,
  SUBMISSION_GRADED:   <CheckCircle2 size={16} className="text-emerald-400" />,
  VIVA_REQUESTED:      <Bell size={16} className="text-amber-400" />,
  PRACTICAL_DEADLINE:  <AlertTriangle size={16} className="text-rose-400" />,
};

const ACCENT_MAP: Record<NotificationEventType, string> = {
  PRACTICAL_PUBLISHED: "var(--color-brand)",
  SUBMISSION_GRADED:   "#34d399",
  VIVA_REQUESTED:      "#fbbf24",
  PRACTICAL_DEADLINE:  "#f43f5e",
};

// ------------------------------------------------------------------
// Individual Toast
// ------------------------------------------------------------------

function NotificationToast({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const icon = ICON_MAP[toast.type];
  const accent = ACCENT_MAP[toast.type];

  const inner = (
    <div
      className="group relative flex w-[340px] max-w-[calc(100vw-2rem)] items-start gap-3.5 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0c0d14]/95 p-4 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl animate-gpu-entry"
      style={{ borderLeftColor: accent, borderLeftWidth: "2px" }}
    >
      {/* Ambient glow behind icon */}
      <div
        className="absolute -top-6 -left-6 size-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      />

      {/* Icon badge */}
      <div
        className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-white/10"
        style={{ background: `${accent}22` }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="relative min-w-0 flex-1">
        <p className="text-[13px] font-bold leading-tight text-white">{toast.title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-white/60">{toast.body}</p>

        {toast.href && (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/50 group-hover:text-white/80 transition-colors">
            Open →
          </span>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss notification"
        className="relative shrink-0 grid size-6 place-items-center rounded-lg text-white/30 transition-colors hover:bg-white/8 hover:text-white"
      >
        <X size={13} />
      </button>
    </div>
  );

  if (toast.href) {
    return (
      <Link href={toast.href} onClick={onDismiss} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------

let _toastId = 0;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Connect SSE and push toasts
  useRealtimeNotifications(
    useCallback((event) => {
      const id = `toast-${++_toastId}`;
      setToasts((prev) => [...prev.slice(-4), { ...event, id }]); // max 5 visible

      // Auto-dismiss after 6s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6_000);
    }, []),
  );

  return (
    <NotificationContext.Provider value={{ toasts, dismiss }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div
        aria-live="polite"
        aria-label="Real-time notifications"
        className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-3"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToast
              toast={toast}
              onDismiss={() => dismiss(toast.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
