import { DemoShell } from "@/components/app-shell";
import { TeacherProgressPage as TeacherProgress } from "@/features/progress/teacher-progress-page";
import { RoleContentBridge } from "@/features/student/role-content-bridge";
import { StudentProgressPage } from "@/features/student/student-progress-page";
import { resolveDemoStudentActor } from "@/server/actors/demo-session";
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
  const studentTargetId = actor.source === "seeded-demo-session"
    ? (await resolveDemoStudentActor()).id
    : actor.id;

  const [teacherOverview, studentOverview] = await Promise.all([
    getTeacherOverview(actor.id),
    getStudentOverview(studentTargetId),
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
