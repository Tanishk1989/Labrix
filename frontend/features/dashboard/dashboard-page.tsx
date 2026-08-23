import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { CreateClassroomButton } from "@/features/classes/classroom-setup-actions";
import type { TeacherOverview } from "@/server/teacher/overview";
import { DashboardMetricStrip } from "./dashboard-metric-strip";
import { buildTeacherDashboardViewModel } from "./dashboard-view-model";
import { LatestTeachingContext } from "./latest-teaching-context";
import { PendingReviewsCard } from "./pending-reviews-card";
import { RecentDashboardActivity } from "./recent-dashboard-activity";
import { TeacherQuickStartGuide } from "./teacher-quick-start-guide";
import { WhatNeedsYou } from "./what-needs-you";

export function TeacherDashboardPage({ overview }: { overview: TeacherOverview }) {
  const dashboard = buildTeacherDashboardViewModel(overview);
  return (
    <div className="space-y-8 sm:space-y-10 [&>header]:mb-0">
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Keep your practicals moving."
        description={dashboard.header.description}
        actions={dashboard.header.action ? (
          <Link href={dashboard.header.action.href} className="button-secondary min-h-11">
            <Plus size={15} aria-hidden="true" /> Create practical
          </Link>
        ) : <CreateClassroomButton />}
        compact
      />

      <PendingReviewsCard overview={overview} />

      <TeacherQuickStartGuide overview={overview} />

      <DashboardMetricStrip metrics={dashboard.metrics} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:items-start lg:gap-8">
        <WhatNeedsYou items={dashboard.attention} />
        <LatestTeachingContext context={dashboard.teachingContext} />
      </div>

      <RecentDashboardActivity submissions={dashboard.recentSubmissions} />
    </div>
  );
}
