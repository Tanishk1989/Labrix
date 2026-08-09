"use server";

import { z } from "zod";
import { resolveDemoStudentActor } from "@/server/actors/demo-session";
import {
  runStudentDraft,
  saveStudentDraft,
  submitStudentDraft,
} from "@/server/attempts/service";

const languageSchema = z.enum(["CPP", "JAVA"]);
const draftInputSchema = z.object({
  sessionId: z.string().cuid(),
  language: languageSchema,
  sourceCode: z.string().max(200_000),
});
const submissionInputSchema = draftInputSchema.extend({
  idempotencyKey: z.string().uuid(),
});

export async function saveDraftAction(input: unknown) {
  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The draft could not be saved." };
  }
  try {
    const actor = await resolveDemoStudentActor();
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
    return { ok: false as const, message: "The simulated run could not start." };
  }
  try {
    const actor = await resolveDemoStudentActor();
    const run = await runStudentDraft({ studentId: actor.id, ...parsed.data });
    return { ok: true as const, run };
  } catch {
    return {
      ok: false as const,
      message: "The simulated execution provider was unavailable. Try again.",
    };
  }
}

export async function submitDraftAction(input: unknown) {
  const parsed = submissionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "The submission could not be created." };
  }
  try {
    const actor = await resolveDemoStudentActor();
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
