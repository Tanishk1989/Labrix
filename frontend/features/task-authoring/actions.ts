"use server";

import { revalidatePath, updateTag } from "next/cache";
import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  PracticalAuthoringError,
  saveTeacherPractical,
} from "@/server/practicals/authoring";
import { CLASSROOM_MANAGEMENT_CACHE_TAG } from "@/server/teacher/cache-tags";
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
      message:
        parsed.error.issues[0]?.message ??
        "Review the practical details before continuing.",
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
      starterCodes: data.starterCodes,
      deadline: data.deadlineLocal ? new Date(data.deadlineLocal) : null,
      maximumMarks: data.maximumMarks,
      rubricCriteria: data.rubricCriteria.map((criterion) => ({
        title: criterion.title,
        maximumMarks: criterion.maximumMarks,
      })),
      testCases: data.testCases.map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        visible: testCase.visible,
      })),
    });

    revalidatePath("/classes");
    revalidatePath(`/classes/${classroomId}`);
    revalidatePath("/practicals");
    updateTag(CLASSROOM_MANAGEMENT_CACHE_TAG);

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
