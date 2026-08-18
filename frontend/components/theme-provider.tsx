"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ColorTheme =
  | "titanium"
  | "cosmic"
  | "sakura"
  | "nordic"
  | "tokyo"
  | "glacier";

interface ThemeContextType {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "titanium",
  setTheme: () => {},
});

export const themePresets: Record<
  ColorTheme,
  {
    name: string;
    description: string;
    accentColor: string;
    accentGlow: string;
    canvasBg: string;
    surfaceBg: string;
    surfaceElevated: string;
    brandHover: string;
    borderSubtle: string;
    spotlightRgb: string;
  }
> = {
  titanium: {
    name: "Titanium Prism",
    description: "Pitch Black & Electric Cyan / Cobalt (Raycast Style)",
    accentColor: "#00f0ff",
    accentGlow: "rgba(0, 240, 255, 0.25)",
    canvasBg: "#000000",
    surfaceBg: "#08080c",
    surfaceElevated: "#101016",
    brandHover: "#38bdf8",
    borderSubtle: "rgba(255, 255, 255, 0.10)",
    spotlightRgb: "0, 240, 255",
  },
  sakura: {
    name: "Neon Sakura",
    description: "Midnight Ink & Luminescent Cyber Rose (Tokyo Drift)",
    accentColor: "#ff2e93",
    accentGlow: "rgba(255, 46, 147, 0.28)",
    canvasBg: "#05050d",
    surfaceBg: "#100918",
    surfaceElevated: "#1a1024",
    brandHover: "#fb7185",
    borderSubtle: "rgba(255, 46, 147, 0.18)",
    spotlightRgb: "255, 46, 147",
  },
  nordic: {
    name: "Nordic Ocean",
    description: "Steel Slate & Arctic Ice Blue (GitHub Dimmed Style)",
    accentColor: "#38bdf8",
    accentGlow: "rgba(56, 189, 248, 0.25)",
    canvasBg: "#060911",
    surfaceBg: "#0c1220",
    surfaceElevated: "#141c30",
    brandHover: "#7dd3fc",
    borderSubtle: "rgba(56, 189, 248, 0.18)",
    spotlightRgb: "56, 189, 248",
  },
  cosmic: {
    name: "Cosmic Ultraviolet",
    description: "Midnight Void & Radiant Amethyst (Linear / Arc Style)",
    accentColor: "#a855f7",
    accentGlow: "rgba(168, 85, 247, 0.25)",
    canvasBg: "#07040f",
    surfaceBg: "#100b21",
    surfaceElevated: "#1a1336",
    brandHover: "#c084fc",
    borderSubtle: "rgba(168, 85, 247, 0.18)",
    spotlightRgb: "168, 85, 247",
  },
  tokyo: {
    name: "Tokyo Night",
    description: "Velvet Charcoal & Lavender Glow (Catppuccin Style)",
    accentColor: "#c084fc",
    accentGlow: "rgba(192, 132, 252, 0.25)",
    canvasBg: "#0b0c16",
    surfaceBg: "#121422",
    surfaceElevated: "#1a1d30",
    brandHover: "#d8b4fe",
    borderSubtle: "rgba(192, 132, 252, 0.18)",
    spotlightRgb: "192, 132, 252",
  },
  glacier: {
    name: "Alpine Glacier",
    description: "Deep Sapphire & Electric Frost Teal (Supabase Linear)",
    accentColor: "#06f0e6",
    accentGlow: "rgba(6, 240, 230, 0.25)",
    canvasBg: "#020710",
    surfaceBg: "#061220",
    surfaceElevated: "#0c1b30",
    brandHover: "#22d3ee",
    borderSubtle: "rgba(6, 240, 230, 0.18)",
    spotlightRgb: "6, 240, 230",
  },
};

const THEME_STORAGE_KEY = "labrix:color_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>("titanium");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ColorTheme | null;
      if (saved && themePresets[saved]) {
        setThemeState(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setTheme = (nextTheme: ColorTheme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const preset = themePresets[theme] ?? themePresets.titanium;

    root.setAttribute("data-theme", theme);
    root.style.setProperty("--color-brand", preset.accentColor);
    root.style.setProperty("--color-brand-hover", preset.brandHover);
    root.style.setProperty("--color-brand-glow", preset.accentGlow);
    root.style.setProperty("--color-canvas", preset.canvasBg);
    root.style.setProperty("--color-surface", preset.surfaceBg);
    root.style.setProperty("--color-surface-elevated", preset.surfaceElevated);
    root.style.setProperty("--color-border-subtle", preset.borderSubtle);
    root.style.setProperty("--spotlight-rgb", preset.spotlightRgb);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorTheme() {
  return useContext(ThemeContext);
}
