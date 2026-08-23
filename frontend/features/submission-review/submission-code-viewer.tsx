"use client";

import React, { useState } from "react";
import { SplitSquareVertical, FileCode } from "lucide-react";

export function SubmissionCodeViewer({
  sourceCode,
  language,
  starterCode,
}: {
  sourceCode: string;
  language: "CPP" | "JAVA";
  starterCode?: string;
}) {
  const [viewMode, setViewMode] = useState<"standard" | "diff">("standard");

  const filename = language === "CPP" ? "solution.cpp" : "Main.java";
  const standardLines = sourceCode.split("\n");

  // Basic diff generator
  const defaultStarter = starterCode || (language === "CPP" ? "#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}" : "public class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}");
  const starterLines = defaultStarter.split("\n");

  return (
    <section aria-labelledby="submitted-source-heading" className="rounded-2xl border border-white/[0.12] bg-white/[0.02] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header Toolbar with Mode Toggles */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.03] p-3.5 px-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="submitted-source-heading" className="text-xs font-bold uppercase tracking-wider text-white">
              Code Inspection Suite
            </h2>
            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white/60">
              {filename}
            </span>
          </div>
          <p className="text-[11px] text-white/50 mt-0.5">
            Immutable submitted source and a line-level starter-template comparison
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("standard")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              viewMode === "standard"
                ? "bg-white/[0.15] text-white shadow-sm border border-white/20"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <FileCode size={13} />
            <span>Standard</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("diff")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              viewMode === "diff"
                ? "bg-white/[0.15] text-white shadow-sm border border-white/20"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <SplitSquareVertical size={13} />
            <span>Starter Diff</span>
          </button>

        </div>
      </header>

      {/* CODE CANVAS AREA */}
      <div
        role="region"
        aria-label={`Source code viewer for ${filename}`}
        tabIndex={0}
        className="max-h-[36rem] overflow-auto bg-[#07090e] py-3 font-mono text-xs leading-6 select-text focus-visible:outline-none"
      >
        {/* MODE 1: STANDARD VIEW */}
        {viewMode === "standard" && (
          standardLines.map((line, index) => (
            <div key={index} className="grid min-w-max grid-cols-[3.5rem_1fr] hover:bg-white/[0.03]">
              <span aria-hidden="true" className="select-none border-r border-white/5 pr-3 text-right text-white/30">
                {index + 1}
              </span>
              <code className="whitespace-pre px-4 text-white/90">{line || " "}</code>
            </div>
          ))
        )}

        {/* MODE 2: STARTER DIFF VIEW */}
        {viewMode === "diff" && (
          <div className="grid md:grid-cols-2 divide-x divide-white/10">
            {/* Starter Code Pane */}
            <div className="min-w-0">
              <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40 bg-black/40 border-b border-white/5">
                Starter template
              </div>
              {starterLines.map((line, index) => (
                <div key={index} className="grid min-w-max grid-cols-[2.5rem_1fr] hover:bg-white/[0.02]">
                  <span aria-hidden="true" className="select-none border-r border-white/5 pr-2 text-right text-white/30 text-[11px]">
                    {index + 1}
                  </span>
                  <code className="whitespace-pre px-3 text-white/60 text-[11px]">{line || " "}</code>
                </div>
              ))}
            </div>

            {/* Student Added Logic Pane */}
            <div className="min-w-0">
              <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                <span>Submitted source</span>
                <span className="text-[9px] font-mono text-emerald-300">Changed lines highlighted</span>
              </div>
              {standardLines.map((line, index) => {
                const isAdded = !starterLines.includes(line);
                return (
                  <div
                    key={index}
                    className={`grid min-w-max grid-cols-[2.5rem_1fr] ${
                      isAdded ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`select-none border-r border-white/5 pr-2 text-right text-[11px] ${
                        isAdded ? "text-emerald-400 font-bold" : "text-white/30"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <code
                      className={`whitespace-pre px-3 text-[11px] ${
                        isAdded ? "text-emerald-200 font-semibold" : "text-white/75"
                      }`}
                    >
                      {line || " "}
                    </code>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
