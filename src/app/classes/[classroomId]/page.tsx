import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { ClassroomOverviewBridge } from "@/features/classes/classroom-overview-bridge";
import { ClassroomOverviewPage } from "@/features/classes/classroom-overview-page";
import { getClassroomOverviewViewModel } from "@/features/classes/classroom-overview-view-model";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  const classroom = await getClassroomOverviewViewModel(
    actor.id,
    classroomId,
    actor.role,
  );
  if (!classroom) notFound();
  return (
    <DemoShell>
      <ClassroomOverviewBridge
        classroom={classroom}
        teacherContent={<ClassroomOverviewPage classroom={classroom} />}
        resolvedRole={actor.source === "external-identity" ? actor.role : undefined}
      />
    </DemoShell>
  );
}
