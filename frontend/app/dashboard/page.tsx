import { DemoShell } from "@/components/app-shell";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { TeacherDashboardPage } from "@/features/dashboard/dashboard-page";
import { getTeacherOverview } from "@/server/teacher/overview";
import { getStudentOverview } from "@/server/student/overview";
import { StudentDashboard } from "@/features/student/student-pages";
import { RoleContentBridge } from "@/features/student/role-content-bridge";

export default async function DashboardPage() {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  const studentTargetId = actor.source === "seeded-demo-session" ? "demo-student-1" : actor.id;

  const [teacherOverview, studentOverview] = await Promise.all([
    getTeacherOverview(actor.id),
    getStudentOverview(studentTargetId),
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
