import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  Clock3,
  LockKeyhole,
  MessageCircleMore,
  Play,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { JoinClassroomButton } from "@/features/classes/classroom-setup-actions";
import type { StudentOverview } from "@/server/student/overview";
import {
  buildStudentDashboardViewModel,
  type StudentDashboardPractical,
} from "./student-dashboard-view-model";

function dateTimeLabel(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function longDateLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function isDueThisWeek(practical: StudentDashboardPractical) {
  if (!practical.deadline) return false;
  const now = Date.now();
  const deadline = new Date(practical.deadline).getTime();
  return deadline >= now && deadline <= now + 7 * 24 * 60 * 60 * 1000;
}

export function StudentDashboard({ overview }: { overview: StudentOverview }) {
  const dashboard = buildStudentDashboardViewModel(overview);

  if (dashboard.state === "NO_CLASSES") {
    return (
      <div className="space-y-10 py-10">
        <PageHeader eyebrow="Home" title={dashboard.headline} description={dashboard.description} actions={<JoinClassroomButton />} />
        <section aria-labelledby="no-classes-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-classes-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">No classes yet</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">Join a class using the code provided by your teacher.</p>
        </section>
      </div>
    );
  }

  if (dashboard.state === "NO_PRACTICALS") {
    return (
      <div className="space-y-10 py-10">
        <PageHeader eyebrow="Home" title={dashboard.headline} description={dashboard.description} actions={<Link href="/classes" className="button min-h-11">View classes</Link>} />
        <section aria-labelledby="no-practicals-heading" className="border-y border-[var(--border)] py-12 sm:py-16">
          <h2 id="no-practicals-heading" className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Nothing waiting for you</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">Published work will appear here when your teacher makes it available.</p>
        </section>
      </div>
    );
  }

  const actionable = dashboard.nextUp ? [dashboard.nextUp, ...dashboard.upcoming] : [];
  const dueThisWeek = actionable.filter(isDueThisWeek).length;
  const feedback = overview.submissions.find((submission) => submission.feedbackAvailable) ?? null;
  const feedbackCount = overview.submissions.filter((submission) => submission.feedbackAvailable).length;
  const pathItems = overview.practicals.slice(0, 3).map((practical) => {
    const isActive = dashboard.nextUp?.id === practical.id;
    const complete = Boolean(practical.latestSubmission);
    return {
      id: practical.id,
      title: practical.title,
      state: complete ? "complete" : isActive ? "active" : "locked",
      detail: complete
        ? `${practical.latestSubmission?.passedTests ?? 0} / ${practical.latestSubmission?.totalTests ?? practical.visibleTestCount} tests passed`
        : isActive
          ? `${practical.visibleTestCount} visible tests`
          : "Next up",
    } as const;
  });

  return (
    <div className="student-focus-dashboard">
      <section className="student-focus-hero" aria-labelledby="student-focus-heading">
        <div className="student-focus-copy">
          <p className="faculty-kicker">Welcome back, student</p>
          <h1 id="student-focus-heading">Ready for your<br /><em>next challenge?</em></h1>
          <p className="student-focus-description">Keep the momentum going—continue where you left off and strengthen your problem-solving skills.</p>
          <div className="student-focus-actions">
            {dashboard.nextUp ? (
              <Link href={dashboard.nextUp.href} className="faculty-primary-action"><Play size={17} aria-hidden="true" /> {dashboard.nextUp.actionLabel}</Link>
            ) : (
              <Link href="/submissions" className="faculty-primary-action">View submissions</Link>
            )}
            <Link href="/practicals" className="faculty-secondary-action">View all practicals <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <p className="faculty-date"><CalendarDays size={14} aria-hidden="true" /> {longDateLabel()}</p>
        </div>

        <Image className="student-focus-campus" src="/assets/trace-campus-lines.png" alt="" width={1200} height={760} priority />

        <aside className="student-next-up" aria-labelledby="student-next-up-heading">
          <p className="faculty-kicker">{dashboard.nextUp ? "Next up" : "Current status"}</p>
          {dashboard.nextUp ? (
            <>
              <h2 id="student-next-up-heading">{dashboard.nextUp.title}</h2>
              <p className="student-next-class"><BookOpenCheck size={16} aria-hidden="true" /> {dashboard.nextUp.classroomSubject} <span>·</span> {dashboard.nextUp.classroomName}</p>
              <dl>
                <div><dt><CalendarDays size={16} aria-hidden="true" /> Deadline</dt><dd className={dashboard.nextUp.statusLabel === "Overdue" ? "student-danger-text" : ""}>{dateTimeLabel(dashboard.nextUp.deadline)}</dd></div>
                <div><dt><Clock3 size={16} aria-hidden="true" /> Status</dt><dd><span className={`student-status-dot student-status-${dashboard.nextUp.statusLabel.toLowerCase().replace(" ", "-")}`} />{dashboard.nextUp.statusLabel}</dd></div>
                <div><dt><TrendingUp size={16} aria-hidden="true" /> Test coverage</dt><dd>{overview.practicals.find((item) => item.id === dashboard.nextUp?.id)?.visibleTestCount ?? 0} visible tests</dd></div>
              </dl>
              <Link href={dashboard.nextUp.href} className="student-next-action"><span>{dashboard.nextUp.actionLabel}</span><ArrowRight size={18} aria-hidden="true" /></Link>
            </>
          ) : (
            <>
              <h2 id="student-next-up-heading">All current work is submitted.</h2>
              <p className="student-next-empty">Review your recent attempts or check progress while you wait for the next practical.</p>
              <Link href="/submissions" className="student-next-action"><span>View submissions</span><ArrowRight size={18} aria-hidden="true" /></Link>
            </>
          )}
        </aside>
      </section>

      <section className="student-focus-metrics" aria-label="Student overview">
        <div><CalendarDays size={23} aria-hidden="true" /><strong>{dueThisWeek}</strong><span><b>Practicals due</b><small>This week</small></span></div>
        <div><MessageCircleMore size={23} aria-hidden="true" /><strong>{feedbackCount}</strong><span><b>Feedback available</b><small>{feedbackCount ? "Review and improve" : "Nothing new"}</small></span></div>
        <div><TrendingUp size={23} aria-hidden="true" /><strong>{dashboard.progress.percentage}%</strong><span><b>Class progress</b><small>{dashboard.progress.submitted} of {dashboard.progress.total} submitted</small></span></div>
      </section>

      <section className="student-focus-lower">
        <article className="student-learning-path" aria-labelledby="learning-path-heading">
          <p className="faculty-kicker">Your learning path</p>
          <h2 id="learning-path-heading" className="sr-only">Your learning path</h2>
          {pathItems.length ? (
            <ol>
              {pathItems.map((item, index) => (
                <li key={item.id} className={`student-path-item student-path-${item.state}`}>
                  <span className="student-path-marker" aria-hidden="true">{item.state === "complete" ? <Check size={20} /> : item.state === "locked" ? <LockKeyhole size={15} /> : index + 1}</span>
                  <Link href={item.state === "complete" ? `/practicals/${item.id}` : `/tasks/${item.id}`}>{item.title}</Link>
                  <b>{item.state === "complete" ? "Complete" : item.state === "active" ? "In progress" : "Next up"}</b>
                  <small>{item.detail}</small>
                </li>
              ))}
            </ol>
          ) : <p className="student-next-empty">Your learning path will appear here as practicals are published.</p>}
          <Link href="/progress" className="faculty-text-link">View full progress <ArrowRight size={14} aria-hidden="true" /></Link>
        </article>

        <aside className="student-feedback-card" aria-labelledby="student-feedback-heading">
          <p className="faculty-kicker">Teacher feedback</p>
          {feedback ? (
            <>
              <div className="student-feedback-author"><span aria-hidden="true"><MessageCircleMore size={19} /></span><div><h2 id="student-feedback-heading">Feedback is ready</h2><p>{feedback.practical.title} · Attempt #{feedback.attemptNumber}</p></div></div>
              <p className="student-feedback-summary">Your teacher has published feedback on this submission. Review it before your next attempt.</p>
              <Link href={`/submissions/${feedback.id}?view=student`} className="faculty-text-link">View feedback <ArrowRight size={14} aria-hidden="true" /></Link>
            </>
          ) : (
            <>
              <div className="student-feedback-author"><span aria-hidden="true"><MessageCircleMore size={19} /></span><div><h2 id="student-feedback-heading">No new feedback</h2><p>Your published reviews will appear here.</p></div></div>
              <Link href="/submissions" className="faculty-text-link">View submissions <ArrowRight size={14} aria-hidden="true" /></Link>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}
