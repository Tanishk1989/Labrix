import { notFound } from "next/navigation";
import Link from "next/link";
import { DemoShell } from "@/components/app-shell";
import { PageHeader, StatusBadge } from "@/components/design-system";
import { CreatePracticalForm } from "@/features/task-authoring/create-practical-form";
import { resolveStarterCodes } from "@/domain/tasks/starter-code";
import { prisma } from "@/lib/db/prisma";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";

export default async function EditPracticalPage({ params, searchParams }: { params: Promise<{ classroomId: string; taskId: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { classroomId, taskId } = await params;
  const { preview } = await searchParams;
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher", requiredRole: "TEACHER" });
  const task = await prisma.task.findFirst({
    where: { id: taskId, classroomId, authorTeacherId: actor.id },
    include: { classroom: { select: { name: true } }, testCases: { orderBy: { position: "asc" } }, rubricCriteria: { orderBy: { position: "asc" } } },
  });
  if (!task) notFound();
  if (preview === "student") {
    const visibleTests = task.testCases.filter((test) => test.visible);
    return <DemoShell actor={actor}><div className="space-y-8">
      <div className="border-l-2 border-[var(--brand-accent)] pl-4 text-sm text-[var(--text-secondary)]">
        Teacher preview. This is how the published content is presented; no student session is created.
      </div>
      <PageHeader breadcrumbs={[{ label: "Practicals", href: "/practicals" }, { label: task.title }]} title={task.title} description={task.classroom.name} actions={<Link href={`/classes/${classroomId}/tasks/${task.id}/edit`} className="button-secondary min-h-11">Back to management</Link>} />
      <section className="space-y-3"><h2 className="section-heading">Instructions</h2><p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{task.instructions}</p></section>
      {task.constraints ? <section className="space-y-3"><h2 className="section-heading">Constraints</h2><p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{task.constraints}</p></section> : null}
      <section className="space-y-3"><h2 className="section-heading">Available languages</h2><div className="flex gap-2">{task.allowedLanguages.map((language) => <StatusBadge key={language} tone="neutral">{language === "CPP" ? "C++" : "Java"}</StatusBadge>)}</div></section>
      <section className="space-y-3"><h2 className="section-heading">Visible tests</h2>{visibleTests.length ? <div className="space-y-3">{visibleTests.map((test, index) => <article key={test.id} className="panel p-4"><p className="text-xs font-semibold text-[var(--text-primary)]">Example {index + 1}</p><pre className="mt-3 overflow-x-auto text-xs text-[var(--text-secondary)]">Input: {test.input}{"\n"}Expected: {test.expectedOutput}</pre></article>)}</div> : <p className="text-sm text-[var(--text-secondary)]">No visible tests are provided for this practical.</p>}</section>
    </div></DemoShell>;
  }
  const localDeadline = task.deadline
    ? new Date(task.deadline.getTime() - task.deadline.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    : "";
  return <DemoShell actor={actor}><CreatePracticalForm classroomId={classroomId} classroomName={task.classroom.name} taskId={task.id} initialStatus={task.status} initialValues={{ title: task.title, instructions: task.instructions, constraints: task.constraints ?? "", allowedLanguages: task.allowedLanguages, starterCodes: resolveStarterCodes(task), deadlineLocal: localDeadline, testCases: task.testCases.map((test) => ({ clientId: test.id, input: test.input, expectedOutput: test.expectedOutput, visible: test.visible })), maximumMarks: task.maximumMarks, rubricCriteria: task.rubricCriteria.map((criterion) => ({ clientId: criterion.id, title: criterion.title, maximumMarks: criterion.maximumMarks })) }} /></DemoShell>;
}
