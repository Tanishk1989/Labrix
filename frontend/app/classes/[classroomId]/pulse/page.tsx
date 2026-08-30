import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { LiveLabPulsePage } from "@/features/classes/live-lab-pulse-page";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";
import { AccessDeniedError } from "@/server/authorization/classroom-access";
import { getTeacherLiveLabPulse } from "@/server/teacher/live-lab-pulse";

export const dynamic = "force-dynamic";

async function loadPulse(teacherId: string, classroomId: string) {
  try {
    return await getTeacherLiveLabPulse(teacherId, classroomId);
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }
}

export default async function ClassroomPulseRoute({
  params,
  searchParams,
}: {
  params: Promise<{ classroomId: string }>;
  searchParams: Promise<{ student?: string }>;
}) {
  const [{ classroomId }, query, actor] = await Promise.all([
    params,
    searchParams,
    resolveCurrentActorForPage({ demoActor: "teacher", requiredRole: "TEACHER" }),
  ]);
  const pulse = await loadPulse(actor.id, classroomId);
  return <DemoShell actor={actor}><LiveLabPulsePage pulse={pulse} selectedStudentId={query.student} /></DemoShell>;
}
