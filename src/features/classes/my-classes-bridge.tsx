"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/design-system";
import { useDemoRole } from "@/components/app-shell";
import { JoinClassroomButton } from "./classroom-setup-actions";
import type { MyClassesViewModel } from "./my-classes-view-model";

function StudentMyClasses({ viewModel }: { viewModel: MyClassesViewModel }) {
  return (
    <>
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">Student workspace</p>
        <h1 className="page-title mt-2 font-semibold tracking-tight text-slate-950">My Classes</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Open a classroom to continue your programming practicals.</p>
      </section>
      <section className="mt-8 max-w-[660px]">
        <h2 className="text-lg font-semibold text-slate-950">Active classes</h2>
        <div className="mt-4 grid gap-5">
          {viewModel.activeClasses.map((classroom) => (
            <article className="classroom-card" key={classroom.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen size={21} aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">{classroom.subject}</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{classroom.name}</h3><p className="mt-1 text-sm text-[var(--text-secondary)]">{classroom.section}</p></div></div>
                <StatusBadge tone="success">Active</StatusBadge>
              </div>
              <p className="mt-5 text-sm text-[var(--text-secondary)]">{classroom.activePracticalCount} active practical{classroom.activePracticalCount === 1 ? "" : "s"}</p>
              <Link href={`/classes/${classroom.id}`} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500">Open classroom <ChevronRight size={16} aria-hidden="true" /></Link>
            </article>
          ))}
          {viewModel.activeClasses.length === 0 && <EmptyState title="No active classes" description="You have no active programming classrooms yet." />}
        </div>
        <JoinClassroomButton />
      </section>
    </>
  );
}

export function MyClassesBridge({ viewModel, teacherContent }: { viewModel: MyClassesViewModel; teacherContent: React.ReactNode }) {
  return useDemoRole() === "student" ? <StudentMyClasses viewModel={viewModel} /> : teacherContent;
}
