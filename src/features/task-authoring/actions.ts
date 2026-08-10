"use server";

import { revalidatePath } from "next/cache";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  PracticalAuthoringError,
  saveTeacherPractical,
} from "@/server/practicals/authoring";
import {
  createPracticalDraftSchema,
  createPracticalPublishSchema,
  type CreatePracticalFormValues,
} from "./schema";

type Result = { ok: true; taskId: string } | { ok: false; message: string };

async function persist(
  classroomId: string,
  taskId: string | undefined,
  values: CreatePracticalFormValues,
  publish: boolean,
): Promise<Result> {
  const parsed = (
    publish ? createPracticalPublishSchema : createPracticalDraftSchema
  ).safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Review the highlighted fields before continuing.",
    };
  }

  try {
    const teacher = requireActorRole(
      await resolveCurrentActor({ demoActor: "teacher" }),
      "TEACHER",
    );
    const data = parsed.data;
    const task = await saveTeacherPractical({
      teacherId: teacher.id,
      classroomId,
      taskId,
      publish,
      title: data.title,
      instructions: data.instructions,
      constraints: data.constraints?.trim() || null,
      allowedLanguages: data.allowedLanguages,
      deadline: data.deadlineLocal ? new Date(data.deadlineLocal) : null,
      testCases: data.testCases.map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
      })),
    });
    revalidatePath("/classes");
    revalidatePath(`/classes/${classroomId}`);
    revalidatePath("/practicals");
    return { ok: true, taskId: task.taskId };
  } catch (error) {
    if (error instanceof PracticalAuthoringError) {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: "The practical could not be saved. Try again.",
    };
  }
}

export async function saveTaskDraft(
  classroomId: string,
  taskId: string | undefined,
  values: CreatePracticalFormValues,
) {
  return persist(classroomId, taskId, values, false);
}

export async function publishTask(
  classroomId: string,
  taskId: string | undefined,
  values: CreatePracticalFormValues,
) {
  return persist(classroomId, taskId, values, true);
}
