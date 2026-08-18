import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { StudentPracticalDetailPage } from "@/features/student/student-practical-detail-page";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { getStudentPractical } from "@/server/student/overview";

export default async function StudentPracticalPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const actor = await resolveCurrentActorForPage({ demoActor: "student", requiredRole: "STUDENT" });
  const practical = await getStudentPractical(actor.id, taskId);
  if (!practical) notFound();
  return <DemoShell actor={actor}><StudentPracticalDetailPage practical={practical} /></DemoShell>;
}
