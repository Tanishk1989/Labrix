import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { CreateClassroomButton } from "@/features/classes/classroom-setup-actions";
import type { TeacherOverview } from "@/server/teacher/overview";
import { DashboardMetricStrip } from "./dashboard-metric-strip";
import { buildTeacherDashboardViewModel } from "./dashboard-view-model";
import { LatestTeachingContext } from "./latest-teaching-context";
import { RecentDashboardActivity } from "./recent-dashboard-activity";
import { WhatNeedsYou } from "./what-needs-you";

export function TeacherDashboardPage({ overview }: { overview: TeacherOverview }) {
  const dashboard = buildTeacherDashboardViewModel(overview);
  const pendingReviewsCount = overview.summary.needsReviewCount;

  return (
    <div className="space-y-10 sm:space-y-12">
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Keep your practicals moving."
        description={dashboard.header.description}
        actions={dashboard.header.action ? (
          <Link href={dashboard.header.action.href} className="button min-h-11">
            <Plus size={15} aria-hidden="true" /> Create practical
          </Link>
        ) : <CreateClassroomButton />}
      />

      {pendingReviewsCount > 0 ? (
        <section aria-label="Urgent reviews pending" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <span className="grid size-10 place-items-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-sm shrink-0">
              {pendingReviewsCount}
            </span>
            <div>
              <p className="text-base font-semibold text-[var(--text-primary)]">
                {pendingReviewsCount === 1 ? "1 submission needs your review" : `${pendingReviewsCount} submissions need your review`}
              </p>
              <p className="text-xs leading-5 text-[var(--text-secondary)]">
                Students are waiting for evaluation marks and feedback on their submissions.
              </p>
            </div>
          </div>
          <Link href="/submissions" className="button min-h-11 shrink-0 font-semibold">
            Review Submissions <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <DashboardMetricStrip metrics={dashboard.metrics} />

      <div className="grid gap-10 sm:gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:items-start lg:gap-10">
        <WhatNeedsYou items={dashboard.attention} />
        <LatestTeachingContext context={dashboard.teachingContext} />
      </div>

      <RecentDashboardActivity submissions={dashboard.recentSubmissions} />
    </div>
  );
}
