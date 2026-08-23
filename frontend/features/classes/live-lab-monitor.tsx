"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";

export interface LiveStudentSession {
  id: string;
  studentName: string;
  studentEmail: string;
  status: "ACTIVE" | "IDLE" | "PASSED" | "ANOMALY";
  lastActive: string;
  testPassCount: number;
  totalTests: number;
  burstPasteDetected?: boolean;
}

export function LiveLabMonitor({
  taskTitle,
  sessions = [],
}: {
  taskTitle: string;
  classroomId?: string;
  sessions?: LiveStudentSession[];
}) {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PASSED" | "ANOMALY">("ALL");

  const filteredSessions = filter === "ALL"
    ? sessions
    : sessions.filter((s) => s.status === filter);

  return (
    <section aria-labelledby="live-lab-monitor-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h2 id="live-lab-monitor-heading" className="text-sm font-bold uppercase tracking-wider text-white">
              Live Lab Monitor · {taskTitle}
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Real-time classroom coding cadence &amp; test execution telemetry
          </p>
        </div>

        {/* Filter Pills if sessions exist */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 text-[11px]">
            {(["ALL", "ACTIVE", "PASSED", "ANOMALY"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-all ${
                  filter === f
                    ? "bg-white/[0.15] text-white shadow-sm border border-white/20"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {f === "ALL" ? "All Roster" : f === "ANOMALY" ? "⚠️ Flagged" : f}
              </button>
            ))}
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-400 mb-2">
            <Activity size={18} className="animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-white">Live Telemetry Stream Active</p>
          <p className="mt-1 text-[11px] text-white/40 max-w-md mx-auto">
            Real-time keystroke cadence, paste-burst anomaly flags, and incremental test-pass counts will stream here as students work on this practical.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredSessions.map((session) => {
            const isAnomaly = session.status === "ANOMALY";
            const isPassed = session.status === "PASSED";
            const isActive = session.status === "ACTIVE";

            return (
              <SpotlightCard
                key={session.id}
                spotlightColor={
                  isAnomaly
                    ? "rgba(239, 68, 68, 0.15)"
                    : isPassed
                      ? "rgba(52, 211, 153, 0.15)"
                      : "rgba(0, 240, 255, 0.12)"
                }
                className="p-4 border border-white/[0.12] bg-white/[0.03] shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-7 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 font-semibold text-[11px] shrink-0">
                      {session.studentName[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{session.studentName}</p>
                      <p className="text-[10px] text-white/40 truncate">{session.lastActive}</p>
                    </div>
                  </div>

                  {isAnomaly ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                      <AlertTriangle size={10} />
                      Burst Paste
                    </span>
                  ) : isPassed ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                      <CheckCircle2 size={10} />
                      All Tests Passed
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold text-cyan-400">
                      <Activity size={10} className="animate-spin" />
                      Coding
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-white/40">
                      <Clock size={10} />
                      Idle
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs border-t border-white/[0.08] pt-2.5 text-white/60">
                  <span className="font-mono text-[11px]">
                    Tests: <strong className="text-white">{session.testPassCount}/{session.totalTests}</strong>
                  </span>
                  <Link
                    href={`/submissions/${session.id}`}
                    className="text-[11px] font-semibold text-[var(--color-brand)] hover:underline"
                  >
                    View Code →
                  </Link>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
