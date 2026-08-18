"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, AlertTriangle, Clock, Terminal, User, Sparkles } from "lucide-react";
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
  classroomId,
}: {
  taskTitle: string;
  classroomId: string;
}) {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PASSED" | "ANOMALY">("ALL");

  // Simulated live roster telemetry for current active lab
  const liveSessions: LiveStudentSession[] = [
    {
      id: "demo-sub-aarav-brackets",
      studentName: "Aarav Sharma",
      studentEmail: "aarav.sharma@trace.edu",
      status: "ANOMALY",
      lastActive: "14s ago",
      testPassCount: 4,
      totalTests: 4,
      burstPasteDetected: true,
    },
    {
      id: "demo-sub-diya-brackets",
      studentName: "Diya Patel",
      studentEmail: "diya.patel@trace.edu",
      status: "ACTIVE",
      lastActive: "Just now",
      testPassCount: 3,
      totalTests: 4,
    },
    {
      id: "demo-sub-rohan-brackets",
      studentName: "Rohan Verma",
      studentEmail: "rohan.verma@trace.edu",
      status: "PASSED",
      lastActive: "2m ago",
      testPassCount: 4,
      totalTests: 4,
    },
    {
      id: "demo-sub-ananya-brackets",
      studentName: "Ananya Iyer",
      studentEmail: "ananya.iyer@trace.edu",
      status: "IDLE",
      lastActive: "8m ago",
      testPassCount: 1,
      totalTests: 4,
    },
  ];

  const filteredSessions = filter === "ALL"
    ? liveSessions
    : liveSessions.filter((s) => s.status === filter);

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
            Real-time classroom coding cadence & test execution telemetry
          </p>
        </div>

        {/* Filter Pills */}
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
      </div>

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
    </section>
  );
}
