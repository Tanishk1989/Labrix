import { DemoShell } from "@/components/app-shell";
import { MyClassesPage } from "@/features/classes/my-classes-page";
import { MyClassesBridge } from "@/features/classes/my-classes-bridge";
import { getMyClassesViewModel } from "@/features/classes/my-classes-view-model";

export default async function ClassesPage() {
  const viewModel = await getMyClassesViewModel();
  return (
    <DemoShell>
      <MyClassesBridge
        viewModel={viewModel}
        teacherContent={<MyClassesPage viewModel={viewModel} />}
      />
    </DemoShell>
  );
}
