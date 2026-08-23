import { DemoShell } from "@/components/app-shell";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { TeacherDashboardPage } from "@/features/dashboard/dashboard-page";
import { getTeacherOverview } from "@/server/teacher/overview";
import { getStudentOverview } from "@/server/student/overview";
import { StudentDashboard } from "@/features/student/student-pages";
import { RoleContentBridge } from "@/features/student/role-content-bridge";
import { resolveDemoStudentActor } from "@/server/actors/demo-session";

export default async function DashboardPage() {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });

  if (actor.source === "external-identity") {
    if (actor.role === "TEACHER") {
      const teacherOverview = await getTeacherOverview(actor.id);
      return (
        <DemoShell actor={actor}>
          <TeacherDashboardPage overview={teacherOverview} />
        </DemoShell>
      );
    }

    const studentOverview = await getStudentOverview(actor.id);
    return (
      <DemoShell actor={actor}>
        <StudentDashboard overview={studentOverview} />
      </DemoShell>
    );
  }

  const studentActor = await resolveDemoStudentActor();
  const [teacherOverview, studentOverview] = await Promise.all([
    getTeacherOverview(actor.id),
    getStudentOverview(studentActor.id),
  ]);

  return (
    <DemoShell actor={actor}>
      <RoleContentBridge
        teacher={<TeacherDashboardPage overview={teacherOverview} />}
        student={<StudentDashboard overview={studentOverview} />}
      />
    </DemoShell>
  );
}
