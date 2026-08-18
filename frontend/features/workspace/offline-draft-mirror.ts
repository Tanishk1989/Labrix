"use client";

import { useEffect, useState } from "react";
import type { AllowedLanguage } from "@prisma/client";

export interface LocalDraftMirrorData {
  sessionId: string;
  sourceCode: string;
  language: AllowedLanguage;
  timestamp: number;
  syncedWithServer: boolean;
}

const STORAGE_PREFIX = "trace:draft-mirror:";

export function getLocalDraftStorageKey(sessionId: string): string {
  return `${STORAGE_PREFIX}${sessionId}`;
}

export function saveLocalDraftMirror(
  sessionId: string,
  data: {
    sourceCode: string;
    language: AllowedLanguage;
    syncedWithServer: boolean;
  },
): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const payload: LocalDraftMirrorData = {
      sessionId,
      sourceCode: data.sourceCode,
      language: data.language,
      timestamp: Date.now(),
      syncedWithServer: data.syncedWithServer,
    };
    window.localStorage.setItem(
      getLocalDraftStorageKey(sessionId),
      JSON.stringify(payload),
    );
    return true;
  } catch {
    // Quota exceeded or private browsing restricted
    return false;
  }
}

export function loadLocalDraftMirror(
  sessionId: string,
): LocalDraftMirrorData | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(getLocalDraftStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as LocalDraftMirrorData;
  } catch {
    return null;
  }
}

export function clearLocalDraftMirror(sessionId: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getLocalDraftStorageKey(sessionId));
  } catch {
    // Ignore storage deletion errors
  }
}

export function reconcileDraftVersions(
  serverSource: string,
  localMirror: LocalDraftMirrorData | null,
): { hasLocalRecovery: boolean; recoveredSource?: string } {
  if (!localMirror) return { hasLocalRecovery: false };
  if (!localMirror.sourceCode || localMirror.sourceCode === serverSource) {
    return { hasLocalRecovery: false };
  }
  // Local code has meaningful changes not present on server
  if (localMirror.sourceCode.trim().length > 0 && !localMirror.syncedWithServer) {
    return {
      hasLocalRecovery: true,
      recoveredSource: localMirror.sourceCode,
    };
  }
  return { hasLocalRecovery: false };
}

/**
 * Hook to listen to browser network online/offline events
 */
export function useNetworkOnlineState() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
