import { connection } from "next/server";
import { DemoShell } from "@/components/app-shell";
import { MyClassesPage } from "@/features/classes/my-classes-page";
import { MyClassesBridge } from "@/features/classes/my-classes-bridge";
import { getMyClassesViewModel } from "@/features/classes/my-classes-view-model";
import { resolveDemoTeacherActor } from "@/server/actors/demo-session";

export default async function ClassesPage() {
  await connection();
  const teacher = await resolveDemoTeacherActor();
  const viewModel = await getMyClassesViewModel(teacher.id);
  return (
    <DemoShell>
      <MyClassesBridge
        viewModel={viewModel}
        teacherContent={<MyClassesPage viewModel={viewModel} />}
      />
    </DemoShell>
  );
}
