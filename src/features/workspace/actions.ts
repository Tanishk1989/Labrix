"use server";

import {
  requireActorRole,
  resolveCurrentActor,
} from "@/server/actors/current-actor";
import {
  runStudentDraft,
  saveStudentDraft,
  submitStudentDraft,
} from "@/server/attempts/service";
import { draftInputSchema, submissionInputSchema } from "./input-schema";

export async function saveDraftAction(input: unknown) {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The draft could not be saved." };
  }
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    const saved = await saveStudentDraft({ studentId: actor.id, ...parsed.data });
    return { ok: true as const, ...saved };
  } catch {
    return {
      ok: false as const,
      message: "Save failed. Your editor buffer is still available; try again.",
    };
  }
}

export async function runDraftAction(input: unknown) {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The run could not start." };
  }
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    const run = await runStudentDraft({ studentId: actor.id, ...parsed.data });
    return { ok: true as const, run };
  } catch {
    return {
      ok: false as const,
      message: "The execution provider was unavailable. Try again.",
    };
  }
}

export async function submitDraftAction(input: unknown) {
  const parsed = submissionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The submission could not be created." };
  }
  try {
    const actor = requireActorRole(
      await resolveCurrentActor({ demoActor: "student" }),
      "STUDENT",
    );
    const submission = await submitStudentDraft({
      studentId: actor.id,
      ...parsed.data,
    });
    return { ok: true as const, submission };
  } catch {
    return {
      ok: false as const,
      message: "The submission was not created. Your saved draft is unchanged.",
    };
  }
}
