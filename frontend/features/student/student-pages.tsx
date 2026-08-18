import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { EmptyState, MetricCard, ProgressBar, StatusBadge } from "@/components/design-system";
import type { StudentOverview } from "@/server/student/overview";

function resultMeta(state: string, passed: number, total: number) {
  if (state === "COMPILATION_ERROR") return { label: "Compilation error", tone: "compilation-error" as const };
  if (state !== "COMPLETED") return { label: state.replaceAll("_", " "), tone: "danger" as const };
  if (total === 0) return { label: "No tests configured", tone: "neutral" as const };
  if (passed === total) return { label: "Passed all provided tests", tone: "passed" as const };
  return { label: `${passed}/${total} tests`, tone: "warning" as const };
}

export { StudentDashboard } from "./student-dashboard";

export function StudentSubmissions({ overview }: { overview: StudentOverview }) {
  return <div className="space-y-5"><header><p className="eyebrow">Student workspace</p><h1 className="page-heading">Submissions</h1><p className="page-subtitle">Your submitted attempts and recorded results.</p></header><div className="panel flex items-center gap-3 p-3"><Search size={14} className="text-[var(--text-muted)]"/><span className="text-xs text-[var(--text-muted)]">All submitted attempts</span><span className="count-chip ml-auto">{overview.submissions.length}</span></div>{overview.submissions.length?<div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="dense-table"><thead><tr><th>Practical</th><th>Class</th><th>Attempt</th><th>Tests</th><th>Language</th><th>Result</th><th>Submitted</th><th></th></tr></thead><tbody>{overview.submissions.map((item)=>{const meta=resultMeta(item.state,item.passedTests,item.totalTests);return <tr key={item.id}><td className="font-semibold text-white">{item.practical.title}</td><td>{item.classroom.name}</td><td>#{item.attemptNumber}</td><td>{item.passedTests}/{item.totalTests}</td><td>{item.language==="CPP"?"C++":"Java"}</td><td><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></td><td className="min-w-44 text-xs text-[var(--text-secondary)]">{new Date(item.submittedAt).toLocaleString("en-IN")}</td><td><Link href={`/submissions/${item.id}`} className="icon-button"><ArrowRight size={13}/></Link></td></tr>})}</tbody></table></div></div>:<EmptyState title="No submissions yet" description="Run and submit a solution from a published practical."/>}</div>;
}

export function StudentProgress({ overview }: { overview: StudentOverview }) {
  return <div className="space-y-5"><header><p className="eyebrow">Student workspace</p><h1 className="page-heading">Progress</h1><p className="page-subtitle">Track which published practicals you have submitted.</p></header><section className="grid gap-3 sm:grid-cols-3"><MetricCard label="Published practicals" value={overview.summary.practicalCount}/><MetricCard label="Submitted practicals" value={overview.summary.submittedPracticalCount}/><MetricCard label="Practicals submitted" value={`${overview.summary.completionPercentage}%`}/></section><section className="panel overflow-hidden"><div className="panel-header"><div><h2 className="section-heading">Class progress</h2><p className="section-description">Each practical is counted once, even when you submit more than one attempt.</p></div></div>{overview.classes.length?<div className="divide-y divide-[var(--border-subtle)]">{overview.classes.map((item)=><Link href={`/classes/${item.id}`} key={item.id} className="grid items-center gap-4 px-4 py-4 hover:bg-[var(--surface-hover)] sm:grid-cols-[1fr_auto_minmax(180px,0.6fr)]"><div><p className="text-sm font-semibold text-white">{item.name}</p><p className="text-[11px] text-[var(--text-muted)]">{item.subject} · {item.section}</p></div><span className="text-xs text-[var(--text-secondary)]">{item.submittedPracticalCount}/{item.practicalCount} submitted</span><ProgressBar value={item.completionPercentage}/></Link>)}</div>:<div className="p-4"><EmptyState title="No class progress" description="Join a class to begin."/></div>}</section></div>;
}
