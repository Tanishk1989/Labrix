import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { resolveDemoTeacherActor } from "@/server/actors/demo-session";
import { getSubmissionForTeacher } from "@/server/attempts/service";

const eventLabels = {
  SESSION_STARTED: "Coding session started",
  DRAFT_SAVED: "Draft saved",
  RUN_REQUESTED: "Simulated run requested",
  RUN_COMPLETED: "Simulated run completed",
  SUBMISSION_CREATED: "Immutable submission created",
} as const;

async function loadReview(submissionId: string) {
  try {
    const actor = await resolveDemoTeacherActor();
    return await getSubmissionForTeacher(actor.id, submissionId);
  } catch {
    notFound();
  }
}

export default async function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const review = await loadReview(submissionId);
  return (
      <DemoShell>
        <Link href={`/classes/${review.task.classroom.id}/students`} className="text-sm font-medium text-indigo-700">
          ← Practical progress
        </Link>
        <p className="mt-4 text-sm text-slate-500">{review.task.classroom.name} / {review.task.title}</p>
        <h1 className="mt-2 text-2xl font-semibold">{review.student.name}’s submission</h1>
        <p className="mt-1 text-sm text-slate-600">Attempt {review.attemptNumber} · {new Date(review.submittedAt).toLocaleString()} · {review.language === "CPP" ? "C++" : "Java"}</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">Submitted source snapshot</h2>
                <p className="mt-1 text-xs text-slate-500">Immutable after submission</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Simulated result</span>
            </div>
            <pre className="mt-5 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">{review.sourceCode}</pre>
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-medium">{review.result.passedTests}/{review.result.totalTests} provided tests passed</p>
              {review.result.errorText && <p className="mt-1 text-rose-700">{review.result.errorText}</p>}
              <p className="mt-1 text-slate-600">Run count for this attempt: {review.runCount}</p>
            </div>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Process timeline</h2>
            <p className="mt-1 text-xs text-slate-500">Foundation events only; no score or AI summary.</p>
            <ol className="mt-5 space-y-4">
              {review.events.map((event) => (
                <li className="border-l-2 border-indigo-200 pl-3" key={event.id}>
                  <p className="text-sm font-medium">{eventLabels[event.type]}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </DemoShell>
  );
}
