import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { PersistedWorkspace } from "@/features/workspace/persisted-workspace";
import { resolveDemoStudentActor } from "@/server/actors/demo-session";
import { getOrCreateStudentWorkspace } from "@/server/attempts/service";

async function loadWorkspace(taskId: string) {
  try {
    const actor = await resolveDemoStudentActor();
    return await getOrCreateStudentWorkspace(actor.id, taskId);
  } catch {
    notFound();
  }
}

export default async function TaskWorkspacePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const workspace = await loadWorkspace(taskId);
  return (
    <DemoShell>
      <PersistedWorkspace workspace={workspace} />
    </DemoShell>
  );
}
