import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { PersistedWorkspace } from "@/features/workspace/persisted-workspace";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getOrCreateStudentWorkspace } from "@/server/attempts/service";

async function loadWorkspace(studentId: string, taskId: string) {
  try {
    return await getOrCreateStudentWorkspace(studentId, taskId);
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
  const actor = await resolveCurrentActorForPage({
    demoActor: "student",
    requiredRole: "STUDENT",
  });
  const workspace = await loadWorkspace(actor.id, taskId);
  return (
    <DemoShell actor={actor}>
      <PersistedWorkspace workspace={workspace} />
    </DemoShell>
  );
}
