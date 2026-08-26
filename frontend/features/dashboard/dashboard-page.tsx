import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";
import { CreateClassroomButton } from "@/features/classes/classroom-setup-actions";
import type { TeacherOverview, TeacherPracticalSummary } from "@/server/teacher/overview";
import { buildTeacherDashboardViewModel } from "./dashboard-view-model";

function dayLabel(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

function practicalHref(practical: TeacherPracticalSummary) {
  return `/classes/${practical.classroomId}`;
}

function PracticalTimeline({ practicals }: { practicals: TeacherPracticalSummary[] }) {
  const visible = practicals.slice(0, 4);

  return (
    <section aria-labelledby="class-timeline-heading" className="faculty-section">
      <div className="faculty-section-heading">
        <div>
          <p className="faculty-kicker">Teaching timeline</p>
          <h2 id="class-timeline-heading">Practicals at a glance</h2>
        </div>
        <Link href="/practicals" className="faculty-text-link">
          View all <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {visible.length ? (
        <ol className="faculty-timeline">
          {visible.map((practical, index) => (
            <li key={practical.id} className="faculty-timeline-row">
              <span className="faculty-timeline-marker" aria-hidden="true">
                {index === 0 ? <CalendarDays size={17} /> : <CheckCircle2 size={16} />}
              </span>
              <div className="min-w-0">
                <div className="faculty-timeline-meta">
                  <time dateTime={practical.deadline ?? practical.createdAt}>
                    {practical.deadline ? `Due ${dayLabel(practical.deadline)}` : `Created ${dayLabel(practical.createdAt)}`}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{practical.status === "PUBLISHED" ? "Published" : "Draft"}</span>
                </div>
                <Link href={practicalHref(practical)} className="faculty-timeline-title">
                  {practical.title}
                </Link>
                <p className="faculty-timeline-detail">
                  {practical.classroomName} · {practical.classroomSubject} · {practical.testCount} tests
                </p>
              </div>
              <div className="faculty-timeline-progress" aria-label={`${practical.completionPercentage}% submitted`}>
                <strong>{practical.completionPercentage}%</strong>
                <span>{practical.submittedCount}/{practical.studentCount || 0} submitted</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="faculty-empty-state">
          <p>No practicals yet.</p>
          <span>Create your first practical when your class is ready.</span>
        </div>
      )}
    </section>
  );
}

function StudentReadiness({ overview }: { overview: TeacherOverview }) {
  const students = overview.progress.students;
  const ready = students.filter((student) => student.completionPercentage >= 75).length;
  const needsPractice = students.filter(
    (student) => student.completionPercentage >= 40 && student.completionPercentage < 75,
  ).length;
  const atRisk = Math.max(0, students.length - ready - needsPractice);
  const total = Math.max(students.length, 1);
  const groups = [
    { label: "Ready", value: ready, tone: "ready" },
    { label: "Needs practice", value: needsPractice, tone: "practice" },
    { label: "Needs support", value: atRisk, tone: "risk" },
  ] as const;

  return (
    <section aria-labelledby="student-readiness-heading" className="faculty-section faculty-readiness">
      <div className="faculty-section-heading">
        <div>
          <p className="faculty-kicker">Student readiness</p>
          <h2 id="student-readiness-heading">A clear signal before class</h2>
        </div>
        <Link href="/progress" className="faculty-text-link">
          View students <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="faculty-readiness-summary">
        <div>
          <strong>{overview.progress.overallCompletionPercentage}%</strong>
          <span>overall completion</span>
        </div>
        <p>
          {atRisk > 0
            ? `${atRisk} ${atRisk === 1 ? "student may" : "students may"} need a personal nudge before the next practical.`
            : "Your students are keeping good momentum across published practicals."}
        </p>
      </div>

      <div className="faculty-readiness-bar" aria-hidden="true">
        {groups.map((group) => (
          <span
            key={group.label}
            className={`faculty-readiness-bar-${group.tone}`}
            style={{ width: `${(group.value / total) * 100}%` }}
          />
        ))}
      </div>

      <dl className="faculty-readiness-groups">
        {groups.map((group) => (
          <div key={group.label}>
            <dt>{group.label}</dt>
            <dd>{group.value}</dd>
            <span>{Math.round((group.value / total) * 100)}% of students</span>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function TeacherDashboardPage({ overview }: { overview: TeacherOverview }) {
  const dashboard = buildTeacherDashboardViewModel(overview);
  const nextPractical = overview.practicals.find((practical) => practical.status === "PUBLISHED") ?? overview.practicals[0];
  const primaryClassroom = overview.classrooms[0];
  const createHref = dashboard.header.action?.href;

  return (
    <div className="faculty-dashboard">
      <header className="faculty-hero">
        <div className="faculty-hero-copy">
          <p className="faculty-kicker">Welcome back, professor</p>
          <h1>Prepare. Challenge.<br /><em>Elevate.</em></h1>
          <p className="faculty-hero-description">
            Run rigorous programming sessions with a calm view of every class,
            practical, and student who may need your attention.
          </p>
          <div className="faculty-hero-actions">
            {createHref ? (
              <Link href={createHref} className="faculty-primary-action">
                <Plus size={17} aria-hidden="true" /> Create practical
              </Link>
            ) : (
              <CreateClassroomButton />
            )}
            <Link href="/classes" className="faculty-secondary-action">
              View classes <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <p className="faculty-date"><CalendarDays size={14} aria-hidden="true" /> {longDateLabel()}</p>
        </div>

        <Image
          src="/assets/trace-campus-lines.png"
          width={900}
          height={560}
          alt=""
          aria-hidden="true"
          className="faculty-campus-art"
          priority
        />

        <aside className="faculty-next-class" aria-labelledby="next-class-heading">
          <p className="faculty-kicker">Next practical</p>
          {nextPractical ? (
            <>
              <h2 id="next-class-heading">{nextPractical.title}</h2>
              <p className="faculty-next-date">{dayLabel(nextPractical.deadline)}</p>
              <dl>
                <div><dt>Class</dt><dd>{nextPractical.classroomName}</dd></div>
                <div><dt>Coverage</dt><dd>{nextPractical.testCount} tests configured</dd></div>
                <div><dt>Progress</dt><dd>{nextPractical.submittedCount}/{nextPractical.studentCount || 0} submitted</dd></div>
              </dl>
              <Link href={practicalHref(nextPractical)} className="faculty-next-class-link">
                <span><Users size={16} aria-hidden="true" /> Open class</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <h2 id="next-class-heading">Your first class starts here.</h2>
              <p className="faculty-next-date">Create a classroom to begin</p>
              <p className="faculty-next-empty">Invite students, publish a practical, and review real code evidence.</p>
            </>
          )}
        </aside>
      </header>

      <section className="faculty-metric-strip" aria-label="Teaching overview">
        <div><GraduationCap size={17} aria-hidden="true" /><span>Active classes</span><strong>{overview.summary.classroomCount}</strong></div>
        <div><Users size={17} aria-hidden="true" /><span>Active students</span><strong>{overview.summary.distinctStudentCount}</strong></div>
        <div><Clock3 size={17} aria-hidden="true" /><span>Needs review</span><strong>{overview.summary.needsReviewCount}</strong></div>
        <p>{dashboard.header.description}</p>
      </section>

      <div className="faculty-dashboard-grid">
        <PracticalTimeline practicals={overview.practicals} />
        <StudentReadiness overview={overview} />
      </div>

      {dashboard.attention.length ? (
        <section className="faculty-attention" aria-labelledby="faculty-attention-heading">
          <div>
            <p className="faculty-kicker">Needs your attention</p>
            <h2 id="faculty-attention-heading">Resolve the important things first.</h2>
          </div>
          <div className="faculty-attention-list">
            {dashboard.attention.slice(0, 3).map((item) => (
              <Link href={item.href} key={item.id}>
                <span>{item.title}</span>
                <small>{item.detail}</small>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      ) : primaryClassroom ? (
        <p className="faculty-calm-state">Everything is moving well in {primaryClassroom.name}. No urgent follow-up is waiting.</p>
      ) : null}
    </div>
  );
}
