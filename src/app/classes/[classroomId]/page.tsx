import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { ClassroomOverviewBridge } from "@/features/classes/classroom-overview-bridge";
import { ClassroomOverviewPage } from "@/features/classes/classroom-overview-page";
import { getClassroomOverviewViewModel } from "@/features/classes/classroom-overview-view-model";
import { resolveDemoTeacherActor } from "@/server/actors/demo-session";

export default async function ClassroomPage({
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
      <ClassroomOverviewBridge
        classroom={classroom}
        teacherContent={<ClassroomOverviewPage classroom={classroom} />}
      />
    </DemoShell>
  );
}
