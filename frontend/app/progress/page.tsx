import { DemoShell } from "@/components/app-shell";
import { TeacherProgressPage as TeacherProgress } from "@/features/progress/teacher-progress-page";
import { RoleContentBridge } from "@/features/student/role-content-bridge";
import { StudentProgressPage } from "@/features/student/student-progress-page";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getStudentOverview } from "@/server/student/overview";
import { getTeacherOverview } from "@/server/teacher/overview";

export default async function TeacherProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string | string[] }>;
}) {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  const params = await searchParams;
  const classroomId = Array.isArray(params.classroom) ? params.classroom[0] : params.classroom;
  if (actor.source === "seeded-demo-session") {
    const [teacherOverview, studentOverview] = await Promise.all([
      getTeacherOverview(actor.id),
      getStudentOverview("demo-student-1"),
    ]);
    return (
      <DemoShell actor={actor}>
        <RoleContentBridge
          teacher={<TeacherProgress overview={teacherOverview} classroomId={classroomId} />}
          student={<StudentProgressPage overview={studentOverview} classroomId={classroomId} />}
        />
      </DemoShell>
    );
  }
  if (actor.role === "STUDENT") {
    const overview = await getStudentOverview(actor.id);
    return <DemoShell actor={actor}><StudentProgressPage overview={overview} classroomId={classroomId} /></DemoShell>;
  }

  const overview = await getTeacherOverview(actor.id);
  return <DemoShell actor={actor}><TeacherProgress overview={overview} classroomId={classroomId} /></DemoShell>;
}
