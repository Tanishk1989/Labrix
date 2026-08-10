import { connection } from "next/server";
import { DemoShell } from "@/components/app-shell";
import { MyClassesPage } from "@/features/classes/my-classes-page";
import { MyClassesBridge } from "@/features/classes/my-classes-bridge";
import { getMyClassesViewModel } from "@/features/classes/my-classes-view-model";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";

export default async function ClassesPage() {
  await connection();
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher" });
  const viewModel = await getMyClassesViewModel(actor.id, actor.role);
  return (
    <DemoShell actor={actor}>
      <MyClassesBridge
        viewModel={viewModel}
        teacherContent={<MyClassesPage viewModel={viewModel} />}
        resolvedRole={actor.source === "external-identity" ? actor.role : undefined}
        allowJoin={actor.source === "seeded-demo-session"}
      />
    </DemoShell>
  );
}
