"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SplitSquareVertical, FileCode, FastForward, AlertTriangle, CheckCircle2 } from "lucide-react";

export function SubmissionCodeViewer({
  sourceCode,
  language,
  starterCode,
}: {
  sourceCode: string;
  language: "CPP" | "JAVA";
  starterCode?: string;
}) {
  const [viewMode, setViewMode] = useState<"standard" | "diff" | "replay">("standard");

  // Replay State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5 | 10>(2);
  const [replayProgress, setReplayProgress] = useState(100); // percentage 0 to 100
  const animationRef = useRef<number | null>(null);

  const fullLength = sourceCode.length;
  const currentChars = Math.floor((replayProgress / 100) * fullLength);
  const displayedReplayCode = sourceCode.slice(0, currentChars);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    let lastTime = performance.now();

    function step(now: number) {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setReplayProgress((prev) => {
        const increment = (delta * 12 * playbackSpeed);
        const next = prev + increment;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(step);
    }

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const filename = language === "CPP" ? "solution.cpp" : "Main.java";
  const standardLines = sourceCode.split("\n");
  const replayLines = displayedReplayCode.split("\n");

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
            Process inspection, starter diff comparison, and keystroke replay
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => { setViewMode("standard"); setIsPlaying(false); }}
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
            onClick={() => { setViewMode("diff"); setIsPlaying(false); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              viewMode === "diff"
                ? "bg-white/[0.15] text-white shadow-sm border border-white/20"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <SplitSquareVertical size={13} />
            <span>Starter Diff</span>
          </button>

          <button
            type="button"
            onClick={() => { setViewMode("replay"); setReplayProgress(0); setIsPlaying(true); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all ${
              viewMode === "replay"
                ? "border border-[var(--color-brand)]/50 bg-[var(--color-brand)]/20 text-[var(--color-brand)] shadow-[0_0_10px_rgba(var(--spotlight-rgb),0.25)]"
                : "text-cyan-400 hover:bg-white/5"
            }`}
          >
            <FastForward size={13} />
            <span>Keystroke Replay</span>
          </button>
        </div>
      </header>

      {/* REPLAY CONTROLS BAR (When Replay Mode is active) */}
      {viewMode === "replay" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-black/60 p-3 px-4 backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/20 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-[var(--color-brand)]/30"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? "Pause" : "Play Timelapse"}</span>
            </button>

            <button
              type="button"
              onClick={() => { setReplayProgress(0); setIsPlaying(false); }}
              title="Reset to Beginning"
              className="grid size-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:text-white"
            >
              <RotateCcw size={12} />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5 text-[10px]">
              {([1, 2, 5, 10] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`rounded px-1.5 py-0.5 font-mono ${
                    playbackSpeed === spd
                      ? "bg-white/20 text-white font-bold"
                      : "text-white/40 hover:text-white/80"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Progress Slider */}
          <div className="flex items-center gap-3 flex-1 max-w-xs min-w-[140px]">
            <input
              type="range"
              min="0"
              max="100"
              value={replayProgress}
              onChange={(e) => {
                setReplayProgress(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-[var(--color-brand)] cursor-pointer h-1.5 rounded-lg bg-white/10"
            />
            <span className="font-mono text-[11px] text-white/60 w-10 text-right">
              {Math.round(replayProgress)}%
            </span>
          </div>
        </div>
      )}

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
                Starter Template Boilerplate
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
                <span>Student Authored Logic</span>
                <span className="text-[9px] font-mono text-emerald-300">+{standardLines.length} lines</span>
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

        {/* MODE 3: KEYSTROKE REPLAY VIEW */}
        {viewMode === "replay" && (
          replayLines.map((line, index) => (
            <div key={index} className="grid min-w-max grid-cols-[3.5rem_1fr] hover:bg-white/[0.03]">
              <span aria-hidden="true" className="select-none border-r border-white/5 pr-3 text-right text-cyan-400/50 font-mono">
                {index + 1}
              </span>
              <code className="whitespace-pre px-4 text-cyan-100 font-mono">
                {line || " "}
                {index === replayLines.length - 1 && isPlaying && (
                  <span className="inline-block size-2 bg-cyan-400 animate-ping ml-1" />
                )}
              </code>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
