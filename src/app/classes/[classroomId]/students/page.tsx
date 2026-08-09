import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getTeacherClassroomProgress } from "@/server/attempts/service";

async function loadProgress(teacherId: string, classroomId: string) {
  try {
    return await getTeacherClassroomProgress(teacherId, classroomId);
  } catch {
    notFound();
  }
}

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const actor = await resolveCurrentActorForPage({
    demoActor: "teacher",
    requiredRole: "TEACHER",
  });
  const progress = await loadProgress(actor.id, classroomId);
  const submitted = progress.students.filter((student) => student.latestSubmission).length;
  return (
      <DemoShell>
        <p className="text-sm text-slate-500">{progress.classroom.name} / Students</p>
        <div className="mt-2 flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Practical progress</h1>
            <p className="mt-1 text-sm text-slate-600">{progress.task?.title ?? "No published practical"}</p>
          </div>
          <span className="text-sm text-slate-500">{submitted}/{progress.students.length} submitted</span>
        </div>
        <section className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500"><tr><th className="py-3">Student</th><th>Status</th><th>Latest result</th><th>Attempt</th><th>Submitted</th><th /></tr></thead>
            <tbody>
              {progress.students.map((student) => (
                <tr className="border-t" key={student.id}>
                  <td className="py-3"><p className="font-medium">{student.name}</p><p className="text-xs text-slate-500">{student.email}</p></td>
                  <td>{student.latestSubmission ? "Submitted" : "Not submitted"}</td>
                  <td>{student.latestSubmission ? `${student.latestSubmission.resultSnapshot.passedTests}/${student.latestSubmission.resultSnapshot.totalTests} tests` : "—"}</td>
                  <td>{student.latestSubmission?.attemptNumber ?? "—"}</td>
                  <td>{student.latestSubmission ? new Date(student.latestSubmission.submittedAt).toLocaleString() : "—"}</td>
                  <td>{student.latestSubmission && <Link className="font-medium text-indigo-700" href={`/submissions/${student.latestSubmission.id}`}>Review</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </DemoShell>
  );
}
