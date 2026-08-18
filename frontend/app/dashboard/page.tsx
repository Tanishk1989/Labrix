import { DemoShell } from "@/components/app-shell";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { TeacherDashboardPage } from "@/features/dashboard/dashboard-page";
import { getTeacherOverview } from "@/server/teacher/overview";
import { getStudentOverview } from "@/server/student/overview";
import { StudentDashboard } from "@/features/student/student-pages";
import { RoleContentBridge } from "@/features/student/role-content-bridge";

export default async function DashboardPage() {
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  if (actor.source === "seeded-demo-session") {
    const [teacherOverview, studentOverview] = await Promise.all([
      getTeacherOverview(actor.id),
      getStudentOverview("demo-student-1"),
    ]);
    return <DemoShell actor={actor}><RoleContentBridge teacher={<TeacherDashboardPage overview={teacherOverview} />} student={<StudentDashboard overview={studentOverview} />} /></DemoShell>;
  }
  if (actor.role === "STUDENT") {
    const overview = await getStudentOverview(actor.id);
    return <DemoShell actor={actor}><StudentDashboard overview={overview} /></DemoShell>;
  }
  const overview = await getTeacherOverview(actor.id);

  return (
    <DemoShell actor={actor}>
      <TeacherDashboardPage overview={overview} />
    </DemoShell>
  );
}
