"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { useColorTheme, themePresets, type ColorTheme } from "./theme-provider";

export function ThemeSelector() {
  const { theme, setTheme } = useColorTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentPreset = themePresets[theme] ?? themePresets.titanium;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-7 items-center justify-center rounded-lg hover:bg-white/[0.08] transition-colors"
        aria-label="Change Theme Preset"
        title={`Theme: ${currentPreset.name}`}
      >
        <span
          className="size-2.5 rounded-full ring-1 ring-white/20"
          style={{ backgroundColor: currentPreset.accentColor }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-white/[0.14] bg-[#0c0d12]/95 p-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/40 flex items-center gap-1.5">
              <Sparkles size={11} className="text-[var(--color-brand)]" />
              Theme Presets
            </p>
          </div>

          {(Object.keys(themePresets) as ColorTheme[]).map((key) => {
            const preset = themePresets[key];
            const isSelected = theme === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTheme(key);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-white/[0.12] to-white/[0.06] font-semibold text-white shadow-sm border border-white/[0.18]"
                    : "text-white/70 hover:bg-white/[0.05] hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="size-3.5 rounded-full border border-white/20 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs truncate">{preset.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{preset.description.split("(")[0]}</p>
                  </div>
                </div>
                {isSelected && <Check size={13} className="text-[var(--color-brand)] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
