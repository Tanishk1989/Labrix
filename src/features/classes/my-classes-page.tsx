import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, ProgressBar } from "@/components/design-system";
import type { MyClassesViewModel } from "./my-classes-view-model";
import { CreateClassroomButton } from "./classroom-setup-actions";

export function MyClassesPage({ viewModel }: { viewModel: MyClassesViewModel }) {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Teacher workspace</p>
          <h1 className="page-heading">Classes</h1>
          <p className="page-subtitle">Manage programming classes and monitor each latest published practical.</p>
        </div>
        <CreateClassroomButton />
      </header>

      {viewModel.activeClasses.length ? (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead><tr><th>Class</th><th>Students</th><th>Published practicals</th><th>Latest completion</th><th>Active practical</th><th>Awaiting submission</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {viewModel.activeClasses.map((classroom) => {
                  const practical = classroom.latestPractical;
                  return (
                    <tr key={classroom.id}>
                      <td>
                        <Link href={`/classes/${classroom.id}`} className="group flex min-w-48 items-center gap-3">
                          <span className="rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">{classroom.subject}</span>
                          <div><p className="font-semibold text-white group-hover:text-[var(--brand-accent)]">{classroom.name}</p><p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{classroom.section}</p></div>
                        </Link>
                      </td>
                      <td>{classroom.studentCount}</td>
                      <td>{classroom.activePracticalCount}</td>
                      <td className="min-w-44"><ProgressBar value={practical?.completionPercentage ?? 0} /></td>
                      <td className="min-w-44 text-xs text-[var(--text-secondary)]">{practical?.title ?? "No published practical"}</td>
                      <td>{practical?.pendingCount ? <span className="status-badge status-warning">{practical.pendingCount} students</span> : <span className="text-xs text-[var(--text-muted)]">None</span>}</td>
                      <td className="text-right"><Link href={`/classes/${classroom.id}`} aria-label={`Open ${classroom.name}`} className="icon-button"><ArrowRight size={14} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : <EmptyState title="No active classes" description="Create a class to start sharing programming practicals with students." actionLabel="Create class" />}
    </div>
  );
}
