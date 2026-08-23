import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { ClassroomOverviewBridge } from "@/features/classes/classroom-overview-bridge";
import { ClassroomOverviewPage } from "@/features/classes/classroom-overview-page";
import { getClassroomOverviewViewModel } from "@/features/classes/classroom-overview-view-model";
import { StudentClassroomCompatibilityPage } from "@/features/student/student-classroom-compatibility-page";
import { resolveDemoStudentActor } from "@/server/actors/demo-session";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getStudentOverview } from "@/server/student/overview";

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  if (actor.source === "seeded-demo-session") {
    const studentActor = await resolveDemoStudentActor();
    const [classroom, studentOverview] = await Promise.all([
      getClassroomOverviewViewModel(actor.id, classroomId, "TEACHER"),
      getStudentOverview(studentActor.id),
    ]);
    if (!classroom) notFound();
    return (
      <DemoShell actor={actor}>
        <ClassroomOverviewBridge
          teacherContent={<ClassroomOverviewPage classroom={classroom} />}
          studentContent={<StudentClassroomCompatibilityPage overview={studentOverview} classroomId={classroomId} />}
        />
      </DemoShell>
    );
  }
  if (actor.role === "STUDENT") {
    const overview = await getStudentOverview(actor.id);
    if (!overview.classes.some((item) => item.id === classroomId)) notFound();
    return <DemoShell actor={actor}><StudentClassroomCompatibilityPage overview={overview} classroomId={classroomId} /></DemoShell>;
  }
  const classroom = await getClassroomOverviewViewModel(actor.id, classroomId, "TEACHER");
  if (!classroom) notFound();
  return (
    <DemoShell actor={actor}>
      <ClassroomOverviewPage classroom={classroom} />
    </DemoShell>
  );
}
