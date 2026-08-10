import { notFound } from "next/navigation";
import { DemoShell } from "@/components/app-shell";
import { CreatePracticalForm } from "@/features/task-authoring/create-practical-form";
import { prisma } from "@/lib/db/prisma";
import { resolveCurrentActorForPage } from "@/server/actors/page-actor";

export default async function EditPracticalPage({ params }: { params: Promise<{ classroomId: string; taskId: string }> }) {
  const { classroomId, taskId } = await params;
  const actor = await resolveCurrentActorForPage({ demoActor: "teacher", requiredRole: "TEACHER" });
  const task = await prisma.task.findFirst({
    where: { id: taskId, classroomId, authorTeacherId: actor.id },
    include: { classroom: { select: { name: true } }, testCases: { orderBy: { position: "asc" } } },
  });
  if (!task) notFound();
  const localDeadline = task.deadline
    ? new Date(task.deadline.getTime() - task.deadline.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    : "";
  return <DemoShell actor={actor}><CreatePracticalForm classroomId={classroomId} classroomName={task.classroom.name} taskId={task.id} initialValues={{ title: task.title, instructions: task.instructions, constraints: task.constraints ?? "", allowedLanguages: task.allowedLanguages, deadlineLocal: localDeadline, testCases: task.testCases.map((test) => ({ clientId: test.id, input: test.input, expectedOutput: test.expectedOutput, visible: test.visible })) }} /></DemoShell>;
}
