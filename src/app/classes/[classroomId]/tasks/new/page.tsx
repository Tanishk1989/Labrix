import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { CreatePracticalForm } from "@/features/task-authoring/create-practical-form";
import { getClassroomOverviewViewModel } from "@/features/classes/classroom-overview-view-model";
import { resolveDemoTeacherActor } from "@/server/actors/demo-session";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const teacher = await resolveDemoTeacherActor();
  const classroom = await getClassroomOverviewViewModel(teacher.id, classroomId);
  if (!classroom) notFound();
  return (
    <DemoShell>
      <header className="mb-6">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link href="/classes" className="hover:text-indigo-700">
            My Classes
          </Link>{" "}
          /{" "}
          <Link
            href={`/classes/${classroomId}`}
            className="hover:text-indigo-700"
          >
            {classroom.name}
          </Link>{" "}
          / <span>Create practical</span>
        </nav>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Create practical
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Prepare a coding task for {classroom.name}.
        </p>
      </header>
      <CreatePracticalForm
        classroomId={classroomId}
        classroomName={classroom.name}
      />
    </DemoShell>
  );
}
