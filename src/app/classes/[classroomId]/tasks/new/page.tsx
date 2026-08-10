import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { CreatePracticalForm } from "@/features/task-authoring/create-practical-form";
import { getClassroomOverviewViewModel } from "@/features/classes/classroom-overview-view-model";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const teacher = await resolveCurrentActorForPage({
    demoActor: "teacher",
    requiredRole: "TEACHER",
  });
  const classroom = await getClassroomOverviewViewModel(
    teacher.id,
    classroomId,
    teacher.role,
  );
  if (!classroom) notFound();
  return (
    <DemoShell actor={teacher}>
      <CreatePracticalForm
        classroomId={classroomId}
        classroomName={classroom.name}
      />
    </DemoShell>
  );
}
