"use client";

import { createContext, useContext } from "react";
import type { IdentityMode } from "@/server/actors/identity-mode";

const IdentityModeContext = createContext<IdentityMode>("demo");

export function IdentityModeProvider({
  mode,
  children,
}: {
  mode: IdentityMode;
  children: React.ReactNode;
}) {
  return (
    <IdentityModeContext.Provider value={mode}>
      {children}
    </IdentityModeContext.Provider>
  );
}

export function useIdentityMode() {
  return useContext(IdentityModeContext);
}
