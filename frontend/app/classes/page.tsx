import { connection } from "next/server";
import { DemoShell } from "@/components/app-shell";
import { MyClassesPage } from "@/features/classes/my-classes-page";
import { MyClassesBridge } from "@/features/classes/my-classes-bridge";
import { getMyClassesViewModel } from "@/features/classes/my-classes-view-model";
import { StudentClassesPage } from "@/features/student/student-classes-page";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getStudentOverview } from "@/server/student/overview";

export default async function ClassesPage() {
  await connection();
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  const studentTargetId = actor.source === "seeded-demo-session" ? "demo-student-1" : actor.id;

  const [teacherViewModel, studentOverview] = await Promise.all([
    getMyClassesViewModel(actor.id, "TEACHER"),
    getStudentOverview(studentTargetId),
  ]);

  return (
    <DemoShell actor={actor}>
      <MyClassesBridge
        teacherContent={<MyClassesPage viewModel={teacherViewModel} />}
        studentContent={<StudentClassesPage overview={studentOverview} allowJoin />}
      />
    </DemoShell>
  );
}
